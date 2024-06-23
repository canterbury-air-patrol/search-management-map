"""
Tests for mission interactions with Organization owned Assets
"""

from assets.tests import AssetsHelpers

from .test_mission_org import MissionOrganizationBaseTestCase


class MissionOrganizationsAssetsTestCase(MissionOrganizationBaseTestCase):
    """
    Test Mission and Organization integration for Assets
    """
    def setUp(self):
        """
        Setup objects
        """
        super().setUp()
        self.assets = AssetsHelpers(self.smm)

    def test_mission_organization_add_asset(self):
        """
        Check that users in organizations can add organization assets to the mission
        """
        # Create a mission
        mission = self.missions.create_mission('test_mission_list', mission_description='test description')
        # Create an organization and add it to this mission
        org1 = self.orgs.create_organization(client=self.smm.client2)
        # Add this organization to the mission
        mission.add_organization(org1)
        # Add an asset to the organization
        asset = self.assets.create_asset(owner=self.smm.user2)
        org1.add_asset(asset, client=self.smm.client2)
        # Check a user in the organization can add an organization asset
        response = mission.add_asset(asset, client=self.smm.client2)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check a user in the organization can remove the asset
        response = mission.remove_asset(asset, client=self.smm.client2)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = mission.get_asset_list(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)

    def test_mission_organization_removed_users_add_del_asset(self):
        """
        Check that users removed from an organization cannot add/remove organization assets from a mission
        """
        # Create a mission
        mission = self.missions.create_mission('test_mission_list', mission_description='test description')
        # Create an organization and add it to this mission
        org1 = self.orgs.create_organization(client=self.smm.client1)
        # Add second user to organization
        org1.add_user(self.smm.user2, client=self.smm.client1, role='A')
        # Add an asset to the organization
        asset = self.assets.create_asset(owner=self.smm.user1)
        org1.add_asset(asset, client=self.smm.client1)
        # Add this organization to the mission
        mission.add_organization(org1)
        # Check a user in the organization can add an organization asset
        response = mission.add_asset(asset, client=self.smm.client2)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check a user in the organization can remove the asset
        response = mission.remove_asset(asset, client=self.smm.client2)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = mission.get_asset_list(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)
        # Remove the user from organization and try again
        org1.remove_user(self.smm.user2, client=self.smm.client1)
        response = mission.add_asset(asset, client=self.smm.client2)
        self.assertEqual(response.status_code, 404)
        # Add the user to mission directly
        response = mission.add_user(client=self.smm.client1, user=self.smm.user2)
        self.assertEqual(response.status_code, 302)
        # Try adding the asset
        response = mission.add_asset(asset, client=self.smm.client2)
        self.assertEqual(response.status_code, 404)  # Form is incomplete/invalid input
        # Add with a user that is actually allowed to
        response = mission.add_asset(asset, client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Try removing the asset
        response = mission.remove_asset(asset, client=self.smm.client2)
        self.assertEqual(response.status_code, 403)
