"""
Tests for mission interactions with Organization owned Assets
"""

from .test_mission_org import MissionOrganizationBaseTestCase


class MissionOrganizationsAssetsTestCase(MissionOrganizationBaseTestCase):
    """
    Test Mission and Organization integration for Assets
    """
    def add_asset_to_organization(self, asset=None, organization=None, client=None, expected_status=200):
        """
        Add an asset to an organization
        """
        if client is None:
            client = self.smm.client1
        if organization is None:
            organization = self.create_organization(client=client)
        if asset is None:
            asset = self.create_asset()
        organization_add_asset_url = f"/organization/{organization['id']}/assets/{asset.pk}/"
        response = client.post(organization_add_asset_url, {})
        self.assertEqual(response.status_code, expected_status)

    def test_mission_organization_add_asset(self):
        """
        Check that users in organizations can add organization assets to the mission
        """
        # Create a mission
        mission = self.create_mission_by_url('test_mission_list', mission_description='test description')
        # Create an organization and add it to this mission
        org1 = self.create_organization(client=self.smm.client2)
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Add an asset to the organization
        asset = self.create_asset(owner=self.smm.user2)
        self.add_asset_to_organization(asset=asset, organization=org1, client=self.smm.client2)
        # Check a user in the organization can add an organization asset
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        mission_assets_json = f'/mission/{mission.pk}/assets/json/'
        response = self.smm.client2.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check a user in the organization can remove the asset
        mission_del_asset_url = f'/mission/{mission.pk}/assets/{asset.pk}/remove/'
        response = self.smm.client2.post(mission_del_asset_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = self.smm.client2.get(mission_assets_json)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)

    def test_mission_organization_removed_users_add_del_asset(self):
        """
        Check that users removed from an organization cannot add/remove organization assets from a mission
        """
        # Create a mission
        mission = self.create_mission_by_url('test_mission_list', mission_description='test description')
        # Create an organization and add it to this mission
        org1 = self.create_organization(client=self.smm.client1)
        # Add second user to organization
        self.add_user_to_org(organization=org1, user=self.smm.user2, client=self.smm.client1, role='A')
        # Add an asset to the organization
        asset = self.create_asset(owner=self.smm.user1)
        self.add_asset_to_organization(asset=asset, organization=org1, client=self.smm.client1)
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Check a user in the organization can add an organization asset
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        mission_assets_json = f'/mission/{mission.pk}/assets/json/'
        response = self.smm.client2.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check a user in the organization can remove the asset
        mission_del_asset_url = f'/mission/{mission.pk}/assets/{asset.pk}/remove/'
        response = self.smm.client2.post(mission_del_asset_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = self.smm.client2.get(mission_assets_json)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)
        # Remove the user from organization and try again
        self.del_user_from_org(organization=org1, user=self.smm.user2, client=self.smm.client1)
        response = self.smm.client2.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.status_code, 404)
        # Add the user to mission directly
        mission_add_user_url = f'/mission/{mission.pk}/users/add/'
        response = self.smm.client1.post(mission_add_user_url, {'user': self.smm.user2.pk})
        self.assertEqual(response.status_code, 302)
        # Try adding the asset
        response = self.smm.client2.post(mission_add_asset_url, {'asset': asset.pk})
        self.assertEqual(response.status_code, 200)  # this is a failure, the form is being shown
        # Add with a user that is actually allowed to
        response = self.smm.client1.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Try removing the asset
        response = self.smm.client2.post(mission_del_asset_url)
        self.assertEqual(response.status_code, 403)
