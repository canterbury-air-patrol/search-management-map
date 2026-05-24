"""
Integration tests for asset behaviour within a mission context
"""

from django.test import TestCase

from smm.tests import SMMTestUsers

from assets.tests import AssetsHelpers

from .models import Mission, MissionUser, MissionAsset


class MissionAssetTestCase(TestCase):
    """
    Tests for asset behaviour that requires a mission context
    """
    def setUp(self):
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

    def test_asset_details_in_mission(self):
        """
        Check asset details API when asset is in a mission
        """
        asset_type = self.assets.create_asset_type()
        asset_name = 'test_asset'
        asset = self.assets.create_asset(name=asset_name, asset_type=asset_type)
        asset_mission_url = f'/assets/{asset.pk}/mission/'
        mission_asset = self.add_asset_to_mission(asset=asset)

        # Pure asset data comes from the asset endpoint
        self.assets.check_asset_details(self, asset)

        # Mission/search context comes from the mission endpoint
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['mission_id'], mission_asset.mission.id)
        self.assertEqual(json_data['mission_name'], mission_asset.mission.mission_name)

        # Create a search and check this doesn't automatically queue it
        search_id = self.create_search(asset=asset, client=self.smm.client1)
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertNotIn('current_search_id', json_data)
        self.assertNotIn('queued_search_id', json_data)
        # Now check the search for the asset and check it is listed as queued
        self.queue_search_for_asset(asset=asset, search_id=search_id, client=self.smm.client1)
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertNotIn('current_search_id', json_data)
        self.assertEqual(json_data['queued_search_id'], search_id)
        # Start the search and check it moves from queued to current
        self.begin_search_for_asset(asset=asset, search_id=search_id, client=self.smm.client1)
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['current_search_id'], search_id)
        self.assertNotIn('queued_search_id', json_data)

    def test_asset_commands(self):
        """
        Check the asset commands are correctly provided to the asset

        Assets can get their commands via the asset details API and also
        in response to reporting their position
        """
        asset = self.assets.create_asset()
        asset_mission_url = f'/assets/{asset.pk}/mission/'
        asset_report_position_url = f'/data/assets/{asset.pk}/position/add/'
        asset_set_command_url = f'/mission/{self.mission.pk}/assets/command/set/'

        # Check the initial case (no command) — last_command lives on the mission endpoint
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(len(json_data['last_command']), 0)
        self.assets.report_position_continue(self, asset)

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
        # Check this command is now showing on the mission endpoint
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
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
        # Check the GOTO is now showing on the mission endpoint
        response = self.smm.client1.get(asset_mission_url, HTTP_ACCEPT='application/json')
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
        self.assertIn('errors', response.json())

    def test_asset_command_set_form_error(self):
        """
        POST to AssetCommandSetView with invalid form data returns 400 with errors
        """
        asset = self.assets.create_asset()
        self.add_asset_to_mission(asset=asset)
        asset_set_command_url = f'/mission/{self.mission.pk}/assets/command/set/'
        response = self.smm.client1.post(asset_set_command_url, {})
        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.json())
