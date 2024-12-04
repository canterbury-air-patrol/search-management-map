"""
Tests for the assets API
"""

from django.test import TestCase

from smm.tests import SMMTestUsers

from mission.models import Mission, MissionUser, MissionAsset

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
        url = '/assets/?all=True' if all_assets else '/assets/'
        return client.get(url, HTTP_ACCEPT='application/json')


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
        self.mission = Mission.objects.create(creator=self.smm.user1, mission_name='mission1')
        MissionUser(mission=self.mission, user=self.smm.user1, permissions_admin=True, creator=self.smm.user1).save()

    def add_asset_to_mission(self, asset=None, mission=None):
        """
        Add an asset to a mission
        """
        if mission is None:
            mission = self.mission
        MissionAsset(mission=mission, asset=asset, creator=self.smm.user1).save()
        return MissionAsset.objects.get(mission=mission, asset=asset)

    def create_search(self, asset=None, client=None):
        """
        Create a basic search for testing queue/assigned etc
        """
        response = client.post(f'/mission/{self.mission.id}/data/pois/create/', {
            'lat': -43.5,
            'lon': 172.5,
            'label': 'test'})
        json_data = response.json()
        response = client.post('/search/sector/create/', data={
            'poi_id': json_data['features'][0]['properties']['pk'],
            'asset_type_id': asset.asset_type.id,
            'sweep_width': '200',
        })
        json_data = response.json()
        return int(json_data['features'][0]['properties']['pk'])

    def queue_search_for_asset(self, asset=None, search_id=None, client=None):
        """
        Queue a search for a specific asset
        """
        response = client.post(f'/search/{search_id}/queue/', {'asset': asset.pk})
        self.assertEqual(response.status_code, 200)

    def begin_search_for_asset(self, asset=None, search_id=None, client=None):
        """
        Begin a search for a specific asset
        """
        response = client.post(f'/search/{search_id}/begin/', {'asset_id': asset.pk})
        self.assertEqual(response.status_code, 200)

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
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['asset_id'], asset.id)
        self.assertEqual(json_data['name'], asset_name)
        self.assertEqual(json_data['asset_type'], asset_type.name)
        self.assertEqual(json_data['owner'], asset.owner.username)
        self.assertTrue('mission_id' not in json_data)
        self.assertTrue('mission_name' not in json_data)
        self.assertTrue('current_search_id' not in json_data)
        self.assertTrue('queued_search_id' not in json_data)

        # Check another user cannot access these details
        response = self.smm.client2.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)

        # Check authenication is required
        response = self.smm.unauth_client.get(asset_details_url)
        self.assertNotEqual(response.status_code, 200)

    def test_asset_details_in_mission(self):
        """
        Check asset details API when asset is in a mission
        """
        asset_type = self.assets.create_asset_type()
        asset_name = 'test_asset'
        asset = self.assets.create_asset(name=asset_name, asset_type=asset_type)
        asset_details_url = f'/assets/{asset.pk}/'
        mission_asset = self.add_asset_to_mission(asset=asset)
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['asset_id'], asset.id)
        self.assertEqual(json_data['name'], asset_name)
        self.assertEqual(json_data['asset_type'], asset_type.name)
        self.assertEqual(json_data['owner'], asset.owner.username)
        self.assertEqual(json_data['mission_id'], mission_asset.mission.id)
        self.assertEqual(json_data['mission_name'], mission_asset.mission.mission_name)

        # Create a search and check this doesn't automatically queue it
        search_id = self.create_search(asset=asset, client=self.smm.client1)
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['asset_id'], asset.id)
        self.assertTrue('current_search_id' not in json_data)
        self.assertTrue('queued_search_id' not in json_data)
        # Now check the search for the asset and check it is listed as queued
        self.queue_search_for_asset(asset=asset, search_id=search_id, client=self.smm.client1)
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['asset_id'], asset.id)
        self.assertTrue('current_search_id' not in json_data)
        self.assertEqual(json_data['queued_search_id'], search_id)
        # Start the search and check it moves from queued to current
        self.begin_search_for_asset(asset=asset, search_id=search_id, client=self.smm.client1)
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['asset_id'], asset.id)
        self.assertEqual(json_data['current_search_id'], search_id)
        self.assertTrue('queued_search_id' not in json_data)

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

    def test_asset_commands(self):
        """
        Check the asset commands are correctly provided to the asset

        Assets can get their commands via the asset details API and also
        in response to reporting their position
        """
        asset = self.assets.create_asset()
        asset_details_url = f'/assets/{asset.pk}/'
        asset_report_position_url = f'/data/assets/{asset.pk}/position/add/'
        asset_set_command_url = f'/mission/{self.mission.pk}/assets/command/set/'

        # Check the initial case (no command)
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(len(json_data['last_command']), 0)
        response = self.smm.client1.post(asset_report_position_url, {
            'lat': -43.5,
            'lng': 172.5,
            'fix': 3,
            'alt': 0,
            'heading': 0,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode('utf8'), 'Continue')

        # Add the asset to the mission so it it is selectable
        self.add_asset_to_mission(asset=asset)

        # Check the form is accessible
        response = self.smm.client1.get(asset_set_command_url)
        self.assertEqual(response.status_code, 200)
        # Set the resume/continue command and check it appears
        response = self.smm.client1.post(asset_set_command_url, {
            'asset': asset.pk,
            'command': 'RON',
            'reason': 'testing',
        })
        self.assertEqual(response.status_code, 200)
        # Check this command is now showing
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['last_command']['action'], 'RON')
        self.assertEqual(json_data['last_command']['reason'], 'testing')
        response = self.smm.client1.post(asset_report_position_url, {
            'lat': -43.5,
            'lon': 172.5,
            'fix': 3,
            'alt': 0,
            'heading': 0,
        })
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['action'], 'RON')
        self.assertEqual(json_data['reason'], 'testing')

        # Check the lat/lon handling
        response = self.smm.client1.post(asset_set_command_url, {
            'asset': asset.pk,
            'command': 'GOTO',
            'reason': 'test GOTO',
            'latitude': -43.5,
            'longitude': 172.5,
        })
        self.assertEqual(response.status_code, 200)
        # Check the GOTO is now showing
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['last_command']['action'], 'GOTO')
        self.assertEqual(json_data['last_command']['reason'], 'test GOTO')
        self.assertEqual(json_data['last_command']['latitude'], -43.5)
        self.assertEqual(json_data['last_command']['longitude'], 172.5)

        # Trigger the invalid lat/lon case
        response = self.smm.client1.post(asset_set_command_url, {
            'asset': asset.pk,
            'command': 'GOTO',
            'reason': 'test GOTO',
            'latitude': 'South',
            'longitude': 'East',
        })
        self.assertEqual(response.status_code, 400)

    def test_asset_record_position_not_other(self):
        """
        Check only the owner of the asset can record the position
        """
        asset = self.assets.create_asset()
        asset_report_position_url = f'/data/assets/{asset.pk}/position/add/'

        # Record the position as the asset owner
        response = self.smm.client1.post(asset_report_position_url, {
            'lat': -43.5,
            'lng': 172.5,
            'fix': 3,
            'alt': 0,
            'heading': 0,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode('utf8'), 'Continue')

        # Attempt to record the position as a non-owner
        response = self.smm.client2.post(asset_report_position_url, {
            'lat': -43.5,
            'lng': 172.5,
            'fix': 3,
            'alt': 0,
            'heading': 0,
        })
        self.assertEqual(response.status_code, 403)
