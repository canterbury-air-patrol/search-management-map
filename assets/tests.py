"""
Tests for the assets API
"""

from django.test import TestCase

from smm.tests import SMMTestUsers

from organization.models import Organization, OrganizationMember, OrganizationAsset

from .models import AssetType, Asset


class AssetsHelpers:
    """
    Useful helper functions for tests that use assets
    """
    def __init__(self, smm):
        self.smm = smm

    def create_asset_type(self, at_name='test_at', at_description='test asset type'):
        """
        Create an asset type object
        """
        return AssetType.objects.create(name=at_name, description=at_description)

    def create_asset(self, name='test_asset', asset_type=None, owner=None):
        """
        Create an asset
        """
        if asset_type is None:
            asset_type = self.create_asset_type()
        if owner is None:
            owner = self.smm.user1
        return Asset.objects.create(name=name, asset_type=asset_type, owner=owner)

    def get_my_asset_list(self, client=None, all_assets=False):
        """
        Get the asset list this user owns
        """
        if client is None:
            client = self.smm.client1
        url = '/organization/assets/' if all_assets else '/assets/'
        return client.get(url, HTTP_ACCEPT='application/json')

    def check_asset_details(self, testcase, asset, client=None):
        """
        Assert the asset details API returns the expected core fields
        """
        if client is None:
            client = self.smm.client1
        response = client.get(f'/assets/{asset.pk}/', HTTP_ACCEPT='application/json')
        testcase.assertEqual(response.status_code, 200)
        json_data = response.json()
        testcase.assertEqual(json_data['asset_id'], asset.id)
        testcase.assertEqual(json_data['name'], asset.name)
        testcase.assertEqual(json_data['asset_type'], asset.asset_type.name)
        testcase.assertEqual(json_data['owner'], asset.owner.username)
        return json_data

    def report_position_continue(self, testcase, asset, client=None):
        """
        Report an asset position and assert the server responds with Continue
        """
        if client is None:
            client = self.smm.client1
        response = client.post(f'/data/assets/{asset.pk}/position/add/', {
            'lat': -43.5,
            'lng': 172.5,
            'fix': 3,
            'alt': 0,
            'heading': 0,
        })
        testcase.assertEqual(response.status_code, 200)
        testcase.assertEqual(response.content.decode('utf8'), 'Continue')


class AssetTestCase(TestCase):
    """
    Tests for Assets
    """
    def setUp(self):
        """
        Create additional required objects
        """
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)

    def check_asset_type_api(self, client=None, at_name=None, at_id=None):
        """
        Check the result of getting the asset type API contains the expected asset type
        """
        response = client.get('/assets/assettypes/', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['asset_types'][0]['name'], at_name)
        self.assertEqual(json_data['asset_types'][0]['id'], at_id)

    def test_asset_type(self):
        """
        Check single asset_type behaviour/API
        """
        at_name = 'test_at'
        at_description = 'test asset type'
        asset_type = self.assets.create_asset_type(at_name, at_description)

        # Check both clients can access this
        self.check_asset_type_api(client=self.smm.client1, at_name=at_name, at_id=asset_type.id)
        self.check_asset_type_api(client=self.smm.client2, at_name=at_name, at_id=asset_type.id)

        # Test that login is required
        response = self.smm.unauth_client.get('/assets/assettypes/', HTTP_ACCEPT='application/json')
        self.assertNotEqual(response.status_code, 200)

    def test_asset_mine(self):
        """
        Check single asset_mine behaviour/API
        """
        asset_type = self.assets.create_asset_type()
        asset_name = 'test_asset'
        asset = self.assets.create_asset(name=asset_name, asset_type=asset_type, owner=self.smm.user1)
        response = self.assets.get_my_asset_list()
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['assets'][0]['name'], asset_name)
        self.assertEqual(json_data['assets'][0]['id'], asset.id)
        self.assertEqual(json_data['assets'][0]['type_id'], asset_type.id)
        self.assertEqual(json_data['assets'][0]['type_name'], asset_type.name)

        # Check a different user doesn't get this asset
        response = self.assets.get_my_asset_list(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(len(json_data['assets']), 0)

        # Check authentication is required
        response = self.assets.get_my_asset_list(client=self.smm.unauth_client)
        self.assertNotEqual(response.status_code, 200)

    def test_asset_details(self):
        """
        Check asset details API
        """
        asset_type = self.assets.create_asset_type()
        asset_name = 'test_asset'
        asset = self.assets.create_asset(name=asset_name, asset_type=asset_type)
        asset_details_url = f'/assets/{asset.pk}/'
        json_data = self.assets.check_asset_details(self, asset)
        self.assertNotIn('mission_id', json_data)
        self.assertNotIn('mission_name', json_data)
        self.assertNotIn('current_search_id', json_data)
        self.assertNotIn('queued_search_id', json_data)

        # Check another user cannot access these details
        response = self.smm.client2.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)

        # Check authenication is required
        response = self.smm.unauth_client.get(asset_details_url)
        self.assertNotEqual(response.status_code, 200)

    def test_asset_details_ui(self):
        """
        Check that only the owner can access the assets UI page
        """
        asset = self.assets.create_asset()
        asset_ui_url = f'/assets/{asset.pk}/'

        # Check the owner has access
        response = self.smm.client1.get(asset_ui_url)
        self.assertEqual(response.status_code, 200)
        # Check another user doesn't
        response = self.smm.client2.get(asset_ui_url)
        self.assertNotEqual(response.status_code, 200)
        # Check authentication is required
        response = self.smm.unauth_client.get(asset_ui_url)
        self.assertNotEqual(response.status_code, 200)

    def test_assets_all_includes_org_assets(self):
        """
        GET /assets/?all=True returns assets belonging to the user's organization
        that the user does not personally own
        """
        org = Organization.objects.create(name='TestOrg', creator=self.smm.user1)
        OrganizationMember.objects.create(
            organization=org, user=self.smm.user1, added_by=self.smm.user1, role='A'
        )
        org_asset = self.assets.create_asset(name='org_asset', owner=self.smm.user2)
        OrganizationAsset.objects.create(
            organization=org, asset=org_asset, added_by=self.smm.user1
        )
        response = self.assets.get_my_asset_list(all_assets=True)
        self.assertEqual(response.status_code, 200)
        names = [a['name'] for a in response.json()['assets']]
        self.assertIn('org_asset', names)

    def test_asset_record_position_not_other(self):
        """
        Check only the owner of the asset can record the position
        """
        asset = self.assets.create_asset()
        asset_report_position_url = f'/data/assets/{asset.pk}/position/add/'

        # Record the position as the asset owner
        self.assets.report_position_continue(self, asset)

        # Attempt to record the position as a non-owner
        response = self.smm.client2.post(asset_report_position_url, {
            'lat': -43.5,
            'lng': 172.5,
            'fix': 3,
            'alt': 0,
            'heading': 0,
        })
        self.assertEqual(response.status_code, 403)
