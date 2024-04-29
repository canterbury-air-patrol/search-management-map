"""
Tests for missions
"""

from django.test import Client

from assets.tests import AssetTestFunctionsBase
from .models import Mission, MissionUser, MissionAsset


class MissionBaseTestCase(AssetTestFunctionsBase):
    """
    Base functions for testing missions
    """
    def create_mission_by_url(self, mission_name, mission_description='description'):
        """
        Create a Mission via the url and return the mission
        """
        mission_create_url = '/mission/new/'
        response = self.client1.post(mission_create_url, data={'mission_name': mission_name, 'mission_description': mission_description}, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.redirect_chain[0][1], 302)
        mission_url = response.redirect_chain[0][0]
        mission_pk = mission_url.split('/')[2]
        mission = Mission.objects.get(pk=int(mission_pk))
        return mission

    def mission_add_user2(self, mission):
        """
        Add user2 to the mission
        """
        MissionUser(mission=mission, user=self.user2, creator=self.user1).save()

    def get_mission_list(self, client=None):
        """
        Get the current mission list
        """
        if client is None:
            client = self.client1
        return client.get('/mission/list/').json()['missions']


class MissionTestCase(MissionBaseTestCase):
    """
    Test Missions API
    """
    def test_mission_create_url(self):
        """
        Create a Mission
        """
        mission_name = 'test1'
        mission_description = 'many lines\nof text'
        mission = self.create_mission_by_url(mission_name, mission_description)
        self.assertEqual(mission.mission_name, mission_name)
        self.assertEqual(mission.mission_description, mission_description)
        self.assertEqual(mission.creator.username, self.user1.username)

    def test_mission_create_url_mission_user(self):
        """
        Create a mission using the url and verify the user was setup as admin
        """
        mission = self.create_mission_by_url('mission')
        mission_user = MissionUser.objects.get(mission=mission, user=self.user1)
        self.assertEqual(mission_user.creator.username, self.user1.username)
        self.assertTrue(mission_user.is_admin())

    def test_mission_user_add_url(self):
        """
        Add a user to a mission using the url
        """
        mission = self.create_mission_by_url('test_mission_user_add_url')
        mission_add_user_url = f'/mission/{mission.pk}/users/add/'
        response = self.client1.post(mission_add_user_url, {'user': self.user2.pk})
        self.assertEqual(response.status_code, 302)
        # Add a user who is already in the mission
        response = self.client1.post(mission_add_user_url, {'user': self.user2.pk})
        self.assertEqual(response.status_code, 403)

    def test_mission_user_access(self):
        """
        Create a mission and check that users can only access missions once added
        """
        mission = self.create_mission_by_url('test_misssion_user_access')
        mission_url = f'/mission/{mission.pk}/details/'
        # Check the user who created the mission can access it
        response = self.client1.get(mission_url)
        self.assertEqual(response.status_code, 200)
        # Use a user who isn't part of the mission, check they get told it doesn't exist
        response = self.client2.get(mission_url)
        self.assertEqual(response.status_code, 404)
        # Add the user to the mission and check they can now access it
        self.mission_add_user2(mission)
        response = self.client2.get(mission_url)
        self.assertEqual(response.status_code, 200)
        # Check a not logged in user gets redirected
        client3 = Client()
        response = client3.get(mission_url)
        self.assertEqual(response.status_code, 302)

    def test_mission_close(self):
        """
        Check that a mission can be closed
        """
        mission = self.create_mission_by_url('test_mission_close')
        mission_close_url = f'/mission/{mission.pk}/close/'
        self.assertIsNone(mission.closed)
        self.assertIsNone(mission.closed_by)
        # Check the mission can be closed
        response = self.client1.get(mission_close_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        self.assertEqual(response.redirect_chain[0][0], '/')
        mission = Mission.objects.get(pk=mission.pk)
        self.assertIsNotNone(mission.closed)
        self.assertEqual(mission.closed_by.username, self.user1.username)
        # Attempt to close a mission that is already closed, should get redirected, with no change to the mission
        response = self.client1.get(mission_close_url)
        self.assertEqual(response.status_code, 302)
        mission2 = Mission.objects.get(pk=mission.pk)
        self.assertEqual(mission.closed, mission2.closed)

    def test_mission_close_only_admin(self):
        """
        Check that missions can only be closed by an admin
        """
        mission = self.create_mission_by_url('test_mission_close_only_admin')
        mission_close_url = f'/mission/{mission.pk}/close/'
        self.mission_add_user2(mission)
        response = self.client2.get(mission_close_url)
        self.assertEqual(response.status_code, 403)
        mission = Mission.objects.get(pk=mission.pk)
        self.assertIsNone(mission.closed)
        self.assertIsNone(mission.closed_by)

    def test_mission_upgrade_to_admin(self):
        """
        Check adding a user and then upgrading them to an admin
        """
        mission = self.create_mission_by_url('test_mission_upgrade_to_admin')
        mission_user2_make_admin_url = f'/mission/{mission.pk}/users/{self.user2.pk}/make/admin/'
        # Try upgrading a user that isn't in the mission
        response = self.client1.get(mission_user2_make_admin_url)
        self.assertEqual(response.status_code, 404)
        # Add the user to the mission and try again
        self.mission_add_user2(mission)
        mission_user = MissionUser.objects.get(mission=mission, user=self.user2)
        self.assertFalse(mission_user.is_admin())
        response = self.client1.get(mission_user2_make_admin_url)
        self.assertEqual(response.status_code, 302)
        mission_user = MissionUser.objects.get(mission=mission, user=self.user2)
        self.assertTrue(mission_user.is_admin())

    def test_mission_list(self):
        """
        Check the mission list contains missions and their correct details
        """
        # Check there are no missions in the list
        mission_list = self.get_mission_list()
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears in the list
        mission = self.create_mission_by_url('test_mission_list', mission_description='test description')
        mission_list = self.get_mission_list()
        self.assertEqual(len(mission_list), 1)
        # Check the details of the mission appear
        self.assertEqual(mission_list[0]['id'], mission.pk)
        self.assertEqual(mission_list[0]['name'], 'test_mission_list')
        self.assertEqual(mission_list[0]['description'], 'test description')
        self.assertIsNotNone(mission_list[0]['started'])
        self.assertEqual(mission_list[0]['creator'], self.user1.username)
        self.assertIsNone(mission_list[0]['closed'])
        self.assertIsNone(mission_list[0]['closed_by'])
        # Check the mission doesn't appear in other users lists
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 0)
        # Add a user and check they now see the mission
        self.mission_add_user2(mission)
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 1)
        # Close the mission and check it appears as closed
        mission_close_url = f'/mission/{mission.pk}/close/'
        self.client1.get(mission_close_url)
        mission_list = self.get_mission_list()
        self.assertEqual(len(mission_list), 1)
        # Check the details of the mission appear
        self.assertEqual(mission_list[0]['id'], mission.pk)
        self.assertEqual(mission_list[0]['name'], 'test_mission_list')
        self.assertEqual(mission_list[0]['description'], 'test description')
        self.assertIsNotNone(mission_list[0]['started'])
        self.assertEqual(mission_list[0]['creator'], self.user1.username)
        self.assertIsNotNone(mission_list[0]['closed'])
        self.assertEqual(mission_list[0]['closed_by'], self.user1.username)


class MissionOrganizationBaseTestCase(MissionBaseTestCase):
    """
    Base setup/functions for testing Mission/Organization integration
    """
    def create_organization(self, organization_name='org', client=None):
        """
        Create an organization
        """
        organization_create_url = '/organization/create/'
        if client is None:
            client = self.client1
        response = client.post(organization_create_url, {'name': organization_name})
        self.assertEqual(response.status_code, 200)
        return response.json()

    def add_user_to_org(self, organization=None, user=None, client=None, role='M'):
        """
        Add a user to an organization
        """
        if client is None:
            client = self.client1
        if organization is None:
            organization = self.create_organization(client=client)
        organization_user_add_url = f"/organization/{organization['id']}/user/{user}/"
        response = client.post(organization_user_add_url, {'role': role})
        self.assertEqual(response.status_code, 200)

    def del_user_from_org(self, organization=None, user=None, client=None):
        """
        Remove a user from the organization
        """
        if client is None:
            client = self.client1
        if organization is None:
            organization = self.create_organization(client=client)
        organization_user_del_url = f"/organization/{organization['id']}/user/{user}/"
        response = client.delete(organization_user_del_url)
        self.assertEqual(response.status_code, 200)

    def add_organization_to_mission(self, mission, organization):
        """
        Add an organization to a mission
        """
        add_org_url = f'/mission/{mission.pk}/organizations/add/'
        response = self.client1.post(add_org_url, data={'organization': organization['id']}, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.redirect_chain[0][1], 302)


class MissionOrganizationsTestCase(MissionOrganizationBaseTestCase):
    """
    Test Mission and Organization integration
    """
    def test_mission_organization_list(self):
        """
        Check that users in organizations can see one copy of the mission in the list
        """
        # Check there are no missions in the list
        mission_list = self.get_mission_list()
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears
        mission = self.create_mission_by_url('test_mission_list', mission_description='test description')
        mission_list = self.get_mission_list()
        self.assertEqual(len(mission_list), 1)
        # Create an organization and add it to this mission
        org1 = self.create_organization()
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Check the mission list still only has 1 entry
        mission_list = self.get_mission_list()
        self.assertEqual(len(mission_list), 1)

    def test_mission_organization_list_for_other(self):
        """
        Check that users can see missions because they are a member of an organization added to the mission
        """
        # Check there are no missions in the list
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears
        mission = self.create_mission_by_url('test_mission_list', mission_description='test description')
        # Check the other user cant see this mission yet
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 0)
        # Create an organization and add it to this mission
        org1 = self.create_organization()
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Add the other user to the organization
        self.add_user_to_org(organization=org1, user=self.user2, client=self.client1)
        # Check the other user can now see this mission
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 1)

    def test_mission_organization_deleted_user(self):
        """
        Check that a user removed from an organization no longer sees missions that organization is a member of
        """
        # Create an organization, make both users a member
        org1 = self.create_organization()
        self.add_user_to_org(organization=org1, user=self.user2, client=self.client1)
        # Check there are no missions in the list
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears
        mission = self.create_mission_by_url('test_mission_org_removed', mission_description='test description')
        # Check the other user cant see this mission yet
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 0)
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Check the other user can now see this mission
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 1)
        # Remove the user from the organization, check it disappears for them
        self.del_user_from_org(organization=org1, user=self.user2, client=self.client1)
        mission_list = self.get_mission_list(client=self.client2)
        self.assertEqual(len(mission_list), 0)


class MissionAssetsTestCase(MissionBaseTestCase):
    """
    Mission/Asset API
    """
    def setUp(self):
        """
        Create the required user/asset
        """
        super().setUp()
        self.asset_type = self.create_asset_type(at_name='test_type')
        self.asset = self.create_asset(name='test-asset', asset_type=self.asset_type)

    def create_mission_by_url(self, mission_name, mission_description='description'):
        """
        Create a Mission via the url and return the mission
        """
        mission_create_url = '/mission/new/'
        response = self.client1.post(mission_create_url, data={'mission_name': mission_name, 'mission_description': mission_description}, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.redirect_chain[0][1], 302)
        mission_url = response.redirect_chain[0][0]
        mission_pk = mission_url.split('/')[2]
        mission = Mission.objects.get(pk=int(mission_pk))
        return mission

    def test_mission_asset_add(self):
        """
        Add an asset to a mission
        """
        mission = self.create_mission_by_url('test_mission_asset_add')
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        response = self.client1.post(mission_add_asset_url, {'asset': self.asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check adding it again gets a fail
        response = self.client1.post(mission_add_asset_url, {'asset': self.asset.pk})
        self.assertEqual(response.status_code, 403)

    def test_mission_asset_delete(self):
        """
        Delete an asset from a mission
        """
        mission = self.create_mission_by_url('test_mission_asset_delete')
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        mission_del_asset_url = f'/mission/{mission.pk}/assets/{self.asset.pk}/remove/'
        # Add the asset
        response = self.client1.post(mission_add_asset_url, {'asset': self.asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Remove the asset
        response = self.client1.get(mission_del_asset_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        mission_asset = MissionAsset.objects.get(mission=mission, asset=self.asset)
        self.assertIsNotNone(mission_asset.removed)
        self.assertEqual(mission_asset.remover.username, self.user1.username)

    def test_mission_asset_json(self):
        """
        Check current assests appear in the asset json
        """
        mission = self.create_mission_by_url('test_mission_asset_list')
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        mission_del_asset_url = f'/mission/{mission.pk}/assets/{self.asset.pk}/remove/'
        mission_assets_json = f'/mission/{mission.pk}/assets/json/'
        response = self.client1.get(mission_assets_json)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)
        # Add the asset
        response = self.client1.post(mission_add_asset_url, {'asset': self.asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = self.client1.get(mission_assets_json)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 1)
        self.assertEqual(assets_data['assets'][0]['name'], self.asset.name)
        self.assertEqual(assets_data['assets'][0]['type_name'], self.asset_type.name)
        # Remove the asset
        response = self.client1.post(mission_del_asset_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = self.client1.get(mission_assets_json)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)


class MissionOrganizationsAssetsTestCase(MissionOrganizationBaseTestCase):
    """
    Test Mission and Organization integration for Assets
    """
    def add_asset_to_organization(self, asset=None, organization=None, client=None, expected_status=200):
        """
        Add an asset to an organization
        """
        if client is None:
            client = self.client1
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
        org1 = self.create_organization(client=self.client2)
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Add an asset to the organization
        asset = self.create_asset(owner=self.user2)
        self.add_asset_to_organization(asset=asset, organization=org1, client=self.client2)
        # Check a user in the organization can add an organization asset
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        mission_assets_json = f'/mission/{mission.pk}/assets/json/'
        response = self.client2.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check a user in the organization can remove the asset
        mission_del_asset_url = f'/mission/{mission.pk}/assets/{asset.pk}/remove/'
        response = self.client2.post(mission_del_asset_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = self.client2.get(mission_assets_json)
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
        org1 = self.create_organization(client=self.client1)
        # Add second user to organization
        self.add_user_to_org(organization=org1, user=self.user2, client=self.client1, role='A')
        # Add an asset to the organization
        asset = self.create_asset(owner=self.user1)
        self.add_asset_to_organization(asset=asset, organization=org1, client=self.client1)
        # Add this organization to the mission
        self.add_organization_to_mission(mission, org1)
        # Check a user in the organization can add an organization asset
        mission_add_asset_url = f'/mission/{mission.pk}/assets/add/'
        mission_assets_json = f'/mission/{mission.pk}/assets/json/'
        response = self.client2.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check a user in the organization can remove the asset
        mission_del_asset_url = f'/mission/{mission.pk}/assets/{asset.pk}/remove/'
        response = self.client2.post(mission_del_asset_url, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = self.client2.get(mission_assets_json)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)
        # Remove the user from organization and try again
        self.del_user_from_org(organization=org1, user=self.user2, client=self.client1)
        response = self.client2.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.status_code, 404)
        # Add the user to mission directly
        mission_add_user_url = f'/mission/{mission.pk}/users/add/'
        response = self.client1.post(mission_add_user_url, {'user': self.user2.pk})
        self.assertEqual(response.status_code, 302)
        # Try adding the asset
        response = self.client2.post(mission_add_asset_url, {'asset': asset.pk})
        self.assertEqual(response.status_code, 200)  # this is a failure, the form is being shown
        # Add with a user that is actually allowed to
        response = self.client1.post(mission_add_asset_url, {'asset': asset.pk}, follow=True)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Try removing the asset
        response = self.client2.post(mission_del_asset_url)
        self.assertEqual(response.status_code, 403)
