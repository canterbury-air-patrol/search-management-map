"""
Tests for Mission interactions with Organizations
"""
from .tests import MissionBaseTestCase


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
        mission = self.create_mission_by_url('test_mission_org_list', mission_description='mission org list')
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
