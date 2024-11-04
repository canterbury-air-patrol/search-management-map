"""
Tests for missions
"""

from django.test import TestCase

from smm.tests import SMMTestUsers

from assets.tests import AssetsHelpers

from .models import Mission, MissionUser, MissionAsset


class MissionTestWrapper:
    """
    Helper functions for dealing with a mission
    """
    def __init__(self, smm, mission_pk):
        self.smm = smm
        self.mission_pk = mission_pk

    def get_object(self):
        """
        Get the Model object associated with this mission
        """
        return Mission.objects.get(pk=self.mission_pk)

    def get_details(self, client=None):
        """
        Get the mission details
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/mission/{self.mission_pk}/details/')

    def add_user(self, client=None, user=None):
        """
        Add a user to the mission
        """
        if client is None:
            client = self.smm.client1
        if user is None:
            user = self.smm.user2
        return client.post(f'/mission/{self.mission_pk}/users/add/', data={
            'user': user.pk,
        })

    def get_user_details(self, client=None, user=None):
        """
        Get the details of a user in the mission
        """
        if client is None:
            client = self.smm.client1
        if user is None:
            user = self.smm.user2
        return client.get(f'/mission/{self.mission_pk}/users/{user.pk}/', HTTP_ACCEPT='application/json')

    def make_admin(self, client=None, user=None):
        """
        Make a mission user an admin
        """
        if client is None:
            client = self.smm.client1
        if user is None:
            user = self.smm.user2
        return client.post(f'/mission/{self.mission_pk}/users/{user.pk}/', data={
            'admin': True,
        })

    def close(self, client=None):
        """
        Close the mission
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/mission/{self.mission_pk}/close/', follow=True)

    def add_asset(self, asset, client=None):
        """
        Add an asset to the mission
        """
        if client is None:
            client = self.smm.client1
        return client.post(f'/mission/{self.mission_pk}/assets/', {'asset': asset.pk}, follow=True)

    def remove_asset(self, asset, client=None):
        """
        Remove an asset from the mission
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/mission/{self.mission_pk}/assets/{asset.pk}/remove/', follow=True)

    def get_asset_list(self, client=None, include_removed=False):
        """
        Get the list of assets in this mission
        """
        if client is None:
            client = self.smm.client1
        extra = '?include_removed=true' if include_removed else ''
        return client.get(f'/mission/{self.mission_pk}/assets/{extra}', HTTP_ACCEPT='application/json')

    def add_organization(self, organization, client=None):
        """
        Add an organization to a mission
        """
        if client is None:
            client = self.smm.client1
        return client.post(f'/mission/{self.mission_pk}/organizations/', data={'organization': organization.org_id}, follow=True)

    def get_organizations(self, client=None):
        """
        Get the list of organizations in this mission
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/mission/{self.mission_pk}/organizations/', HTTP_ACCEPT='application/json')


class MissionFunctions:
    """
    Helper functions for testing missions
    """
    def __init__(self, smm):
        self.smm = smm

    def create_mission(self, mission_name, mission_description='description', client=None):
        """
        Create a mission
        """
        if client is None:
            client = self.smm.client1
        response = client.post('/mission/new/', data={
            'mission_name': mission_name,
            'mission_description': mission_description,
        }, follow=True)
        mission_url = response.redirect_chain[0][0]
        mission_pk = mission_url.split('/')[2]
        return MissionTestWrapper(self.smm, mission_pk)

    def get_mission_list(self, client=None, only=None):
        """
        Get the current mission list
        """
        if client is None:
            client = self.smm.client1
        only_query = f'?only={only}' if only is not None else ''
        return client.get(f'/mission/list/{only_query}').json()['missions']


class MissionBaseTestCase(TestCase):
    """
    Base functions for testing missions
    """
    def setUp(self):
        """
        Create required objects
        """
        self.smm = SMMTestUsers()
        self.missions = MissionFunctions(self.smm)


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
        mission = self.missions.create_mission(mission_name, mission_description).get_object()
        self.assertEqual(mission.mission_name, mission_name)
        self.assertEqual(mission.mission_description, mission_description)
        self.assertEqual(mission.creator.username, self.smm.user1.username)

    def test_mission_create_url_mission_user(self):
        """
        Create a mission using the url and verify the user was setup as admin
        """
        mission = self.missions.create_mission('mission').get_object()
        mission_user = MissionUser.objects.get(mission=mission, user=self.smm.user1)
        self.assertEqual(mission_user.creator.username, self.smm.user1.username)
        self.assertTrue(mission_user.is_admin())

    def test_mission_user_add_url(self):
        """
        Add a user to a mission using the url
        """
        mission = self.missions.create_mission('test_mission_user_add_url')
        response = mission.add_user(client=self.smm.client1, user=self.smm.user2)
        self.assertEqual(response.status_code, 302)
        # Add a user who is already in the mission
        response = mission.add_user(client=self.smm.client1, user=self.smm.user2)
        self.assertEqual(response.status_code, 403)

    def test_mission_user_access(self):
        """
        Create a mission and check that users can only access missions once added
        """
        mission = self.missions.create_mission('test_misssion_user_access')
        # Check the user who created the mission can access it
        response = mission.get_details(client=self.smm.client1)
        self.assertEqual(response.status_code, 200)
        # Use a user who isn't part of the mission, check they get told it doesn't exist
        response = mission.get_details(client=self.smm.client2)
        self.assertEqual(response.status_code, 404)
        # Add the user to the mission and check they can now access it
        mission.add_user(client=self.smm.client1, user=self.smm.user2)
        response = mission.get_details(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        # Check a not logged in user gets redirected
        response = mission.get_details(client=self.smm.unauth_client)
        self.assertEqual(response.status_code, 302)

    def test_mission_close(self):
        """
        Check that a mission can be closed
        """
        mission = self.missions.create_mission('test_mission_close')
        mission_obj = mission.get_object()
        self.assertIsNone(mission_obj.closed)
        self.assertIsNone(mission_obj.closed_by)
        # Check the mission can be closed
        response = mission.close(client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        self.assertEqual(response.redirect_chain[0][0], '/')
        mission_obj = mission.get_object()
        self.assertIsNotNone(mission_obj.closed)
        self.assertEqual(mission_obj.closed_by.username, self.smm.user1.username)
        # Attempt to close a mission that is already closed, should get redirected, with no change to the mission
        response = mission.close(client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        mission2_obj = mission.get_object()
        self.assertEqual(mission_obj.closed, mission2_obj.closed)

    def test_mission_close_only_admin(self):
        """
        Check that missions can only be closed by an admin
        """
        mission = self.missions.create_mission('test_mission_close_only_admin')
        mission.add_user()
        response = mission.close(client=self.smm.client2)
        self.assertEqual(response.status_code, 403)
        mission_obj = mission.get_object()
        self.assertIsNone(mission_obj.closed)
        self.assertIsNone(mission_obj.closed_by)

    def test_mission_upgrade_to_admin(self):
        """
        Check adding a user and then upgrading them to an admin
        """
        mission = self.missions.create_mission('test_mission_upgrade_to_admin')
        mission_obj = mission.get_object()
        # Try upgrading a user that isn't in the mission
        response = mission.make_admin(client=self.smm.client1, user=self.smm.user2)
        self.assertEqual(response.status_code, 404)
        # Add the user to the mission and try again
        mission.add_user(user=self.smm.user2)
        mission_user = MissionUser.objects.get(mission=mission_obj, user=self.smm.user2)
        self.assertFalse(mission_user.is_admin())
        response = mission.make_admin(client=self.smm.client1, user=self.smm.user2)
        self.assertEqual(response.status_code, 302)
        mission_user = MissionUser.objects.get(mission=mission_obj, user=self.smm.user2)
        self.assertTrue(mission_user.is_admin())

    def test_mission_list(self):
        """
        Check the mission list contains missions and their correct details
        """
        # Check there are no missions in the list
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears in the list
        mission = self.missions.create_mission('test_mission_list', mission_description='test description')
        mission_obj = mission.get_object()
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 1)
        # Check the details of the mission appear
        self.assertEqual(mission_list[0]['id'], mission_obj.pk)
        self.assertEqual(mission_list[0]['name'], 'test_mission_list')
        self.assertEqual(mission_list[0]['description'], 'test description')
        self.assertIsNotNone(mission_list[0]['started'])
        self.assertEqual(mission_list[0]['creator'], self.smm.user1.username)
        self.assertIsNone(mission_list[0]['closed'])
        self.assertIsNone(mission_list[0]['closed_by'])
        # Check the mission doesn't appear in other users lists
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 0)
        # Add a user and check they now see the mission
        mission.add_user(client=self.smm.client1, user=self.smm.user2)
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 1)
        # Close the mission and check it appears as closed
        mission.close(client=self.smm.client1)
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 1)
        # Check the details of the mission appear
        self.assertEqual(mission_list[0]['id'], mission_obj.pk)
        self.assertEqual(mission_list[0]['name'], 'test_mission_list')
        self.assertEqual(mission_list[0]['description'], 'test description')
        self.assertIsNotNone(mission_list[0]['started'])
        self.assertEqual(mission_list[0]['creator'], self.smm.user1.username)
        self.assertIsNotNone(mission_list[0]['closed'])
        self.assertEqual(mission_list[0]['closed_by'], self.smm.user1.username)

    def test_mission_list_only(self):
        """
        Check the mission list contains missions and only the ones required
        """
        # Create 2 missions and check they appear in the list
        mission1 = self.missions.create_mission('test_mission_list', mission_description='test description')
        mission1_obj = mission1.get_object()
        mission2 = self.missions.create_mission('test_mission_list', mission_description='test description')
        mission2_obj = mission2.get_object()
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 2)
        # Check both appear in only active list
        mission_list = self.missions.get_mission_list(only='active')
        self.assertEqual(len(mission_list), 2)
        # and neither in the closed list
        mission_list = self.missions.get_mission_list(only='closed')
        self.assertEqual(len(mission_list), 0)
        # Now close one and check the right ones appear in the filtered lists
        mission1.close()
        # Check the only active list
        mission_list = self.missions.get_mission_list(only='active')
        self.assertEqual(len(mission_list), 1)
        self.assertEqual(mission_list[0]['id'], mission2_obj.pk)
        # and neither in the closed list
        mission_list = self.missions.get_mission_list(only='closed')
        self.assertEqual(len(mission_list), 1)
        self.assertEqual(mission_list[0]['id'], mission1_obj.pk)
        # Close the other mission and check again
        mission2.close()
        mission_list = self.missions.get_mission_list(only='active')
        self.assertEqual(len(mission_list), 0)
        # and neither in the closed list
        mission_list = self.missions.get_mission_list(only='closed')
        self.assertEqual(len(mission_list), 2)


class MissionUsersTestCase(MissionBaseTestCase):
    """
    Mission/User API
    """
    def test_mission_user_creator(self):
        """
        Check user that started the mission gets mission data
        """
        mission = self.missions.create_mission('test_mission_user_creator')
        response = mission.get_user_details(user=self.smm.user1)
        self.assertEqual(response.status_code, 200)

    def test_mission_user_non_member(self):
        """
        Check users who are not members, cannot access the details of mission users
        """
        mission = self.missions.create_mission('test_mission_user_non_member')
        response = mission.get_user_details(client=self.smm.client2, user=self.smm.user1)
        self.assertEqual(response.status_code, 404)

    def test_mission_other_member(self):
        """
        Check that details of users is available once they are added to the mission
        """
        mission = self.missions.create_mission('test_mission_other_member')
        response = mission.get_user_details(user=self.smm.user2)
        self.assertEqual(response.status_code, 404)
        # Add the user to the mission and check they exist
        mission.add_user(user=self.smm.user2)
        response = mission.get_user_details(user=self.smm.user2)
        self.assertEqual(response.status_code, 200)


class MissionAssetsTestCase(MissionBaseTestCase):
    """
    Mission/Asset API
    """
    def setUp(self):
        """
        Create the required user/asset
        """
        super().setUp()
        self.assets = AssetsHelpers(self.smm)
        self.asset_type = self.assets.create_asset_type(at_name='test_type')
        self.asset = self.assets.create_asset(name='test-asset', asset_type=self.asset_type)

    def test_mission_asset_add(self):
        """
        Add an asset to a mission
        """
        mission = self.missions.create_mission('test_mission_asset_add')
        response = mission.add_asset(self.asset, client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Check adding it again gets a fail
        response = mission.add_asset(self.asset, client=self.smm.client1)
        self.assertEqual(response.status_code, 403)

    def test_mission_asset_delete(self):
        """
        Delete an asset from a mission
        """
        mission = self.missions.create_mission('test_mission_asset_delete')
        # Add the asset
        response = mission.add_asset(self.asset, client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        # Remove the asset
        response = mission.remove_asset(self.asset, client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        mission_asset = MissionAsset.objects.get(mission=mission.get_object(), asset=self.asset)
        self.assertIsNotNone(mission_asset.removed)
        self.assertEqual(mission_asset.remover.username, self.smm.user1.username)

    def test_mission_asset_json(self):
        """
        Check current assets appear in the asset json
        """
        mission = self.missions.create_mission('test_mission_asset_list')
        response = mission.get_asset_list(client=self.smm.client1)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)
        # Add the asset
        response = mission.add_asset(self.asset, client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = mission.get_asset_list(client=self.smm.client1)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 1)
        self.assertEqual(assets_data['assets'][0]['name'], self.asset.name)
        self.assertEqual(assets_data['assets'][0]['type_name'], self.asset_type.name)
        # Remove the asset
        response = mission.remove_asset(self.asset, client=self.smm.client1)
        self.assertEqual(response.redirect_chain[0][1], 302)
        response = mission.get_asset_list(client=self.smm.client1)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 0)
        # Check getting all results
        response = mission.get_asset_list(client=self.smm.client1, include_removed=True)
        self.assertEqual(response.status_code, 200)
        assets_data = response.json()
        self.assertEqual(len(assets_data['assets']), 1)
