"""
Tests for the asset class
"""

import json

from django.test import TestCase
from django.core import serializers

from icons.models import Icon
from smm.tests import SMMTestUsers

from .models import Asset, AssetType
from .tests import AssetsHelpers


class AssetTestCase(TestCase):
    """
    Test the functionality associated with assets
    """
    def setUp(self):
        """
        Create objects for the test
        """
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)

        boat = self.assets.create_asset_type(at_name='boat')
        wing = self.assets.create_asset_type(at_name='wing')
        self.assets.create_asset(name='PCCR', asset_type=boat, owner=self.smm.user1)
        self.assets.create_asset(name='FX-79-1', asset_type=wing, owner=self.smm.user2)
        self.assets.create_asset(name='FX-79-2', asset_type=wing, owner=self.smm.user1)

    def test_asset_name(self):
        """
        Check the name is the stringified version
        """
        pccr = Asset.objects.get(name='PCCR')
        fx_79_1 = Asset.objects.get(name='FX-79-1')
        fx_79_2 = Asset.objects.get(name='FX-79-2')
        self.assertEqual(str(pccr), 'PCCR')
        self.assertEqual(str(fx_79_1), 'FX-79-1')
        self.assertEqual(str(fx_79_2), 'FX-79-2')

    def test_asset_type(self):
        """
        Check asset type is correctly reflected
        """
        pccr = Asset.objects.get(name='PCCR')
        fx_79_1 = Asset.objects.get(name='FX-79-1')
        fx_79_2 = Asset.objects.get(name='FX-79-2')
        self.assertEqual(str(pccr.asset_type), 'boat')
        self.assertEqual(str(fx_79_1.asset_type), 'wing')
        self.assertEqual(str(fx_79_2.asset_type), 'wing')

    def test_asset_natural_key(self):
        """
        Check the natural key is the pk
        """
        pccr = Asset.objects.get(name='PCCR')
        fx_79_1 = Asset.objects.get(name='FX-79-1')
        fx_79_2 = Asset.objects.get(name='FX-79-2')
        self.assertEqual(pccr.natural_key(), pccr.pk)
        self.assertEqual(fx_79_1.natural_key(), fx_79_1.pk)
        self.assertEqual(fx_79_2.natural_key(), fx_79_2.pk)
        # Check it works correctly as the primary key
        serialised = serializers.serialize('json', [pccr], use_natural_primary_keys=True)
        data = json.loads(serialised)
        self.assertFalse('pk' in data[0])
        self.assertEqual(data[0]['fields']['name'], 'PCCR')

    def test_asset_icon_url_asset_icon(self):
        """
        Asset.icon_url() returns the asset's own icon URL when the asset has an icon set
        """
        icon = Icon.objects.create(name='boat_icon', filename='boat.png')
        asset_type = self.assets.create_asset_type(at_name='icontype')
        asset = Asset.objects.create(name='IconAsset', asset_type=asset_type,
                                     owner=self.smm.user1, icon=icon)
        self.assertEqual(asset.icon_url(), f'/icons/{icon.pk}.png')
        data = asset.as_object()
        self.assertEqual(data['icon_url'], f'/icons/{icon.pk}.png')

    def test_asset_icon_url_asset_type_icon(self):
        """
        Asset.icon_url() falls back to asset_type icon when asset has no icon of its own
        """
        icon = Icon.objects.create(name='type_icon', filename='type.png')
        asset_type = AssetType.objects.create(name='icontype2', description='', icon=icon)
        asset = Asset.objects.create(name='TypeIconAsset', asset_type=asset_type,
                                     owner=self.smm.user1, icon=None)
        self.assertEqual(asset.icon_url(), f'/icons/{icon.pk}.png')

    def test_asset_mine_list(self):
        """
        Check the my assets list correctly reflects only assets the current user owns
        """
        response = self.assets.get_my_asset_list(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue('assets' in data)
        self.assertTrue('name' in data['assets'][0])
        self.assertEqual('FX-79-1', data['assets'][0]['name'])
        self.assertEqual('wing', data['assets'][0]['type_name'])
        self.assertEqual(self.smm.user2.username, data['assets'][0]['owner'])
        # check the default request returns html
        response = self.smm.client2.get('/assets/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, text='<!DOCTYPE html>')
