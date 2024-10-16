"""
Tests for mission asset status
"""

from assets.tests import AssetsHelpers

from organization.tests import OrganizationFunctions

from .models import MissionAssetStatusValue
from .tests import MissionBaseTestCase


class MissionAssetsTestCase(MissionBaseTestCase):
    """
    Mission Asset Status API
    """
    def setUp(self):
        """
        Create the required user/asset/organization
        """
        super().setUp()
        self.organizations = OrganizationFunctions(self.smm)
        self.assets = AssetsHelpers(self.smm)
        self.asset_type = self.assets.create_asset_type(at_name='test_type')
        self.asset = self.assets.create_asset(name='test-asset', asset_type=self.asset_type)

    def create_status_value(self, name, description=None):
        """
        Create a Mission Asset Status Value
        """
        return MissionAssetStatusValue.objects.create(name=name, description=description)

    # pylint: disable=R0913,R0917
    def set_mission_asset_status(self, mission, asset, status, notes=None, client=None):
        """
        Set the mission assets status
        """
        if client is None:
            client = self.smm.client1
        data = {
            'value_id': status.pk,
        }
        if notes is not None:
            data['notes'] = notes
        return client.post(f'/mission/{mission.mission_pk}/assets/{asset.pk}/status/', data)

    def get_mission_asset_status(self, mission, asset, client=None):
        """
        Get the mission assets status
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/mission/{mission.mission_pk}/assets/{asset.pk}/status/', HTTP_ACCEPT='application/json')

    def test_0001_check_asset_not_in_mission(self):
        """
        Check that the api fails for assets not in mission
        """
        mission = self.missions.create_mission('test asset status')
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 404)
        status_value1 = self.create_status_value('test1')
        res = self.set_mission_asset_status(mission, self.asset, status_value1)
        self.assertEqual(res.status_code, 404)

    def test_0002_check_asset_mission(self):
        """
        Test setting the asset status
        """
        mission = self.missions.create_mission('test asset status')
        mission.add_asset(self.asset)
        status_value1 = self.create_status_value('test1')
        res = self.set_mission_asset_status(mission, self.asset, status_value1)
        self.assertEqual(res.status_code, 200)
        json_data = res.json()['status']
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 200)
        json_data_get = res.json()['status']
        self.assertEqual(json_data['since'], json_data_get['since'])

    def test_0003_check_order_asset_mission(self):
        """
        Test setting the asset status
        """
        mission = self.missions.create_mission('test asset status')
        mission.add_asset(self.asset)
        status_value1 = self.create_status_value('test1')
        status_value2 = self.create_status_value('test2')
        res = self.set_mission_asset_status(mission, self.asset, status_value1)
        self.assertEqual(res.status_code, 200)
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 200)
        # Create a second status
        res = self.set_mission_asset_status(mission, self.asset, status_value2)
        self.assertEqual(res.status_code, 200)
        json_data = res.json()['status']
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 200)
        json_data_get = res.json()['status']
        self.assertEqual(json_data['since'], json_data_get['since'])

    def test_0010_check_only_owner_can_set_status(self):
        """
        Check that only the asset owner can set the status for asset
        """
        mission = self.missions.create_mission('test asset status')
        mission.add_asset(self.asset)
        status_value1 = self.create_status_value('test1')
        # try with the non-owner user
        res = self.set_mission_asset_status(mission, self.asset, status_value1, client=self.smm.client2)
        self.assertEqual(res.status_code, 404)
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 404)
        # add client2 to the mission and try again
        mission.add_user(user=self.smm.user2)
        res = self.set_mission_asset_status(mission, self.asset, status_value1, client=self.smm.client2)
        self.assertEqual(res.status_code, 403)
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 404)
        # Check the owner can set the status
        res = self.set_mission_asset_status(mission, self.asset, status_value1)
        self.assertEqual(res.status_code, 200)
        json_data = res.json()['status']
        res = self.get_mission_asset_status(mission, self.asset)
        self.assertEqual(res.status_code, 200)
        json_data_get = res.json()['status']
        self.assertEqual(json_data['since'], json_data_get['since'])

    def test_0011_check_radio_operator_can_set_status(self):
        """
        Check that a radio operator for the asset can set the status
        """
        mission = self.missions.create_mission('test asset status')
        mission.add_asset(self.asset)
        status_value1 = self.create_status_value('test1')
        org = self.organizations.create_organization()
        res = org.add_asset(self.asset)
        self.assertEqual(res.status_code, 200)
        # Add the org to mission
        mission.add_organization(org)
        # Add the test user as a normal role
        org.add_user(user=self.smm.user2, client=self.smm.client1, role='M')
        res = self.set_mission_asset_status(mission, self.asset, status_value1, client=self.smm.client2)
        self.assertEqual(res.status_code, 403)
        # Upgrade the user to a radio operator and try again
        org.add_user(user=self.smm.user2, client=self.smm.client1, role='R')
        res = self.set_mission_asset_status(mission, self.asset, status_value1, client=self.smm.client2)
        self.assertEqual(res.status_code, 200)
