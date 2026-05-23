"""
Tests for asset decorator functions.
"""

from unittest.mock import patch

from django.test import TestCase, RequestFactory
from django.http import HttpResponse

from smm.tests import SMMTestUsers

from .models import Asset, AssetType
from .decorators import (
    asset_is_recorder,
    asset_is_operator,
    asset_is_owner,
    asset_id_in_get_post,
)


class AssetDecoratorsTestCase(TestCase):
    """Tests for the asset access-control decorators."""

    def setUp(self):
        self.smm = SMMTestUsers()
        self.factory = RequestFactory()
        self.at = AssetType.objects.create(name='boat', description='b')

    def _make_asset(self, owner=None):
        return Asset.objects.create(name='A1', owner=owner, asset_type=self.at)

    def test_asset_is_recorder_owner_allowed(self):
        """Asset owner is allowed to record positions."""
        asset = self._make_asset(owner=self.smm.user1)

        @asset_is_recorder
        def view(request, asset=None):
            return HttpResponse(f'ok:{asset.name}')

        req = self.factory.get('/')
        req.user = self.smm.user1
        resp = view(req, asset_id=asset.pk)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('A1', resp.content.decode())

    def test_asset_is_recorder_org_allowed(self):
        """Org-level recorder permission allows access."""
        asset = self._make_asset(owner=None)

        @asset_is_recorder
        def view(request, asset=None):  # pylint: disable=unused-argument
            return HttpResponse('ok')

        req = self.factory.get('/')
        req.user = self.smm.user1
        with patch('assets.decorators.organization_user_is_asset_recorder', return_value=True):
            resp = view(req, asset_id=asset.pk)
        self.assertEqual(resp.status_code, 200)

    def test_asset_is_recorder_forbidden(self):
        """Users without recorder permission receive 403; with permission, view is called."""
        asset = self._make_asset(owner=None)

        @asset_is_recorder
        def view(request, asset=None):  # pylint: disable=unused-argument
            return HttpResponse('ok')

        req = self.factory.get('/')
        req.user = self.smm.user1
        with patch('assets.decorators.organization_user_is_asset_recorder', return_value=True):
            resp = view(req, asset_id=asset.pk)
        self.assertEqual(resp.status_code, 200)
        with patch('assets.decorators.organization_user_is_asset_recorder', return_value=False):
            resp = view(req, asset_id=asset.pk)
        self.assertEqual(resp.status_code, 403)

    def test_asset_is_operator_org_allowed_and_forbidden(self):
        """Org radio-operator permission allows access; absence returns 403."""
        asset = self._make_asset(owner=None)

        @asset_is_operator
        def view(request, asset=None):  # pylint: disable=unused-argument
            return HttpResponse('op')

        req = self.factory.get('/')
        req.user = self.smm.user1
        # org operator allowed
        with patch('assets.decorators.organization_user_is_asset_radio_operator', return_value=True):
            resp = view(req, asset_id=asset.pk)
        self.assertEqual(resp.status_code, 200)

        # forbidden when not owner and not org operator
        with patch('assets.decorators.organization_user_is_asset_radio_operator', return_value=False):
            resp2 = view(req, asset_id=asset.pk)
        self.assertEqual(resp2.status_code, 403)

    def test_asset_is_owner(self):
        """Asset owner is allowed; other users receive 403."""
        asset = self._make_asset(owner=self.smm.user1)

        @asset_is_owner
        def view(request, asset=None):  # pylint: disable=unused-argument
            return HttpResponse('owner')

        req = self.factory.get('/')
        req.user = self.smm.user1
        resp = view(req, asset_id=asset.pk)
        self.assertEqual(resp.status_code, 200)

        # other user should be forbidden
        req2 = self.factory.get('/')
        req2.user = self.smm.user2
        resp2 = view(req2, asset_id=asset.pk)
        self.assertEqual(resp2.status_code, 403)

    def test_asset_id_in_get_post_and_not_allowed(self):
        """asset_id_in_get_post resolves asset from GET/POST and rejects other methods."""
        asset = self._make_asset(owner=self.smm.user1)

        @asset_id_in_get_post
        def view(request, asset=None):
            return HttpResponse(f'ok:{asset.name}')

        # GET path
        req = self.factory.get('/', data={'asset_id': asset.pk})
        req.user = self.smm.user1
        resp = view(req)
        self.assertEqual(resp.status_code, 200)

        # POST path
        req2 = self.factory.post('/', data={'asset_id': asset.pk})
        req2.user = self.smm.user1
        resp2 = view(req2)
        self.assertEqual(resp2.status_code, 200)

        # not allowed method
        req3 = self.factory.put('/')
        req3.user = self.smm.user1
        resp3 = view(req3)
        # HttpResponseNotAllowed yields 405
        self.assertEqual(resp3.status_code, 405)

    def test_asset_id_in_get_post_forbidden(self):
        """Users without operator permission receive 403."""
        asset = self._make_asset(owner=None)

        @asset_id_in_get_post
        def view(request, asset=None):  # pylint: disable=unused-argument
            return HttpResponse('ok')

        req = self.factory.get('/', data={'asset_id': asset.pk})
        req.user = self.smm.user1
        with patch('assets.decorators.organization_user_is_asset_radio_operator', return_value=False):
            resp = view(req)
        self.assertEqual(resp.status_code, 403)
