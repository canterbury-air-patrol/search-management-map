"""
Tests for Mission interactions with Organizations
"""
from organization.tests import OrganizationFunctions

from .tests import MissionBaseTestCase


class MissionOrganizationBaseTestCase(MissionBaseTestCase):
    """
    Base setup/functions for testing Mission/Organization integration
    """
    def setUp(self):
        super().setUp()
        self.orgs = OrganizationFunctions(self.smm)


class MissionOrganizationsTestCase(MissionOrganizationBaseTestCase):
    """
    Test Mission and Organization integration
    """
    def test_user_mission_organization_list(self):
        """
        Check that users in organizations can see one copy of the mission in the list
        """
        # Check there are no missions in the list
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears
        mission = self.missions.create_mission('test_mission_org_list', mission_description='mission org list')
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 1)
        # Create an organization and add it to this mission
        org1 = self.orgs.create_organization()
        # Add this organization to the mission
        mission.add_organization(org1)
        # Check the mission list still only has 1 entry
        mission_list = self.missions.get_mission_list()
        self.assertEqual(len(mission_list), 1)

    def test_user_mission_organization_list_for_other(self):
        """
        Check that users can see missions because they are a member of an organization added to the mission
        """
        # Check there are no missions in the list
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears
        mission = self.missions.create_mission('test_mission_list', mission_description='test description')
        # Check the other user cant see this mission yet
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 0)
        # Create an organization and add it to this mission
        org1 = self.orgs.create_organization()
        # Add this organization to the mission
        mission.add_organization(org1)
        # Add the other user to the organization
        org1.add_user(self.smm.user2, client=self.smm.client1)
        # Check the other user can now see this mission
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 1)

    def test_user_mission_organization_deleted_user(self):
        """
        Check that a user removed from an organization no longer sees missions that organization is a member of
        """
        # Create an organization, make both users a member
        org1 = self.orgs.create_organization()
        org1.add_user(self.smm.user2, client=self.smm.client1)
        # Check there are no missions in the list
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 0)
        # Create a mission and check it appears
        mission = self.missions.create_mission('test_mission_org_removed', mission_description='test description')
        # Check the other user cant see this mission yet
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 0)
        # Add this organization to the mission
        mission.add_organization(org1)
        # Check the other user can now see this mission
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 1)
        # Remove the user from the organization, check it disappears for them
        org1.remove_user(self.smm.user2, client=self.smm.client1)
        mission_list = self.missions.get_mission_list(client=self.smm.client2)
        self.assertEqual(len(mission_list), 0)

    def test_mission_organization_list(self):
        """
        Check that organization(s) added to the mission appear in the organization list
        """
        org1 = self.orgs.create_organization('org1')
        org2 = self.orgs.create_organization('org2')
        mission = self.missions.create_mission('test_org_list')
        # check the initial organization list
        mission_org_list = mission.get_organizations().json()
        self.assertEqual(len(mission_org_list['organizations']), 0)
        # check an organization appears in the list
        mission.add_organization(org1)
        mission_org_list = mission.get_organizations().json()
        self.assertEqual(len(mission_org_list['organizations']), 1)
        self.assertEqual(mission_org_list['organizations'][0]['organization']['id'], org1.org_id)
        # check all organizations appears in the list
        mission.add_organization(org2)
        mission_org_list = mission.get_organizations().json()
        self.assertEqual(len(mission_org_list['organizations']), 2)
