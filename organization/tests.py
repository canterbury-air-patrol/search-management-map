"""
Tests for Organizations
"""

from django.test import Client, TestCase
from django.contrib.auth import get_user_model

from assets.models import Asset, AssetType


class OrganizationTestCase(TestCase):
    """
    Test Organizations API
    """
    def setUp(self):
        """
        Create the required users
        """
        self.user1_password = 'password'
        self.user2_password = 'password'
        self.user1 = get_user_model().objects.create_user('test1', password=self.user1_password)
        self.user2 = get_user_model().objects.create_user('test2', password=self.user2_password)
        self.client1 = Client()
        self.client1.login(username=self.user1.username, password=self.user1_password)
        self.client2 = Client()
        self.client2.login(username=self.user2.username, password=self.user2_password)

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

    def get_url_json(self, url, client=None):
        """
        Get the response from a url as json
        """
        if client is None:
            client = self.client1
        response = client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        return response.json()

    def get_all_organizations(self, client=None):
        """
        Get all the organizations
        """
        organization_list_all_url = '/organization/list/all/'
        json_data = self.get_url_json(organization_list_all_url, client=client)
        self.assertTrue('organizations' in json_data)
        return json_data['organizations']

    def get_my_organizations(self, client=None):
        """
        Get any organizations the current user is in
        """
        organization_list_mine_url = '/organization/list/mine/'
        json_data = self.get_url_json(organization_list_mine_url, client=client)
        self.assertTrue('organizations' in json_data)
        return json_data['organizations']

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

    def get_org_asset_list(self, organization=None, client=None):
        """
        Get the list of assets in an organization
        """
        if client is None:
            client = self.client1
        if organization is None:
            organization = self.create_organization(client=client)
        organization_asset_list_url = f"/organization/{organization['id']}/assets/"
        json_data = self.get_url_json(organization_asset_list_url, client)
        return json_data['assets']

    def create_asset_type(self, at_name='test_at', at_description='test asset type'):
        """
        Create an asset type object
        """
        AssetType(name=at_name, description=at_description).save()
        return AssetType.objects.get(name=at_name)

    def create_asset(self, name='test_asset', asset_type=None, owner=None):
        """
        Create an asset
        """
        if asset_type is None:
            asset_type = self.create_asset_type()
        if owner is None:
            owner = self.user1
        Asset(name=name, asset_type=asset_type, owner=owner).save()
        return Asset.objects.get(name=name)

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

    def test_organization_create(self):
        """
        Test creating organizations
        """
        organization_create_url = '/organization/create/'
        organization_name = 'org1'
        alt_organization_name = 'alt org'
        # Check that get cannot be used
        response = self.client1.get(organization_create_url, {'name': organization_name})
        self.assertEqual(response.status_code, 405)
        # Check that post can be used
        response = self.client1.post(organization_create_url, {'name': organization_name})
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['name'], organization_name)
        self.assertEqual(json_data['creator'], self.user1.username)
        # That attempting to create the same organization fails
        response = self.client1.post(organization_create_url, {'name': organization_name})
        self.assertNotEqual(response.status_code, 200)
        # That creating an organization with a new name is allowed
        json_data = self.create_organization(organization_name=alt_organization_name, client=self.client1)
        self.assertEqual(json_data['name'], alt_organization_name)
        self.assertEqual(json_data['creator'], self.user1.username)
        self.assertEqual(json_data['role'], 'Admin')

    def test_organization_lists(self):
        """
        Test the users organization list
        """
        # Check there are currently no organizations listed
        org_list = self.get_all_organizations(client=self.client1)
        self.assertEqual(len(org_list), 0)
        org_list = self.get_all_organizations(client=self.client2)
        self.assertEqual(len(org_list), 0)
        # Create an organization for each user
        org1 = self.create_organization(organization_name='org1', client=self.client1)
        org2 = self.create_organization(organization_name='org2', client=self.client2)
        # Check they both show up in the all list
        org_list = self.get_all_organizations(client=self.client1)
        self.assertEqual(len(org_list), 2)
        org_list = self.get_all_organizations(client=self.client2)
        self.assertEqual(len(org_list), 2)
        # Check the mine list only shows the correct org for each user
        org_list = self.get_my_organizations(client=self.client1)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org1')
        self.assertEqual(org_list[0]['role'], 'Admin')
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org2')
        self.assertEqual(org_list[0]['role'], 'Admin')

    def test_organization_user_add(self):
        """
        Test adding a user to an organization
        """
        # Check user 2 is not in any orgs
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 0)
        # Create an org and then add user2
        org = self.create_organization(organization_name='org', client=self.client1)
        self.add_user_to_org(organization=org, user=self.user2.username, client=self.client1)
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org')
        self.assertEqual(org_list[0]['role'], 'Member')
        # get user2 to create an org and then add user1 to it
        org_list = self.get_my_organizations(client=self.client1)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['role'], 'Admin')
        # create the new org for user2
        org = self.create_organization(organization_name='org2', client=self.client2)
        # Check user1 can't see it currently
        org_list = self.get_my_organizations(client=self.client1)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['role'], 'Admin')
        # Check user1 can't add themselves
        organization_user_add_url = f"/organization/{org['id']}/user/{self.user1.username}/"
        response = self.client1.post(organization_user_add_url, {'role': 'M'})
        # should get a 404 if they aren't in the organization
        self.assertEqual(response.status_code, 404)
        org_list = self.get_my_organizations(client=self.client1)
        self.assertEqual(len(org_list), 1)
        # Add user1
        self.add_user_to_org(organization=org, user=self.user1.username, client=self.client2)
        org_list = self.get_my_organizations(client=self.client1)
        self.assertEqual(len(org_list), 2)
        self.assertEqual(org_list[1]['role'], 'Member')
        # Check that user1 attempting to admin themself results in 403
        response = self.client1.post(organization_user_add_url, {'role': 'M'})
        self.assertEqual(response.status_code, 403)

    def test_organization_user_remove(self):
        """
        Test adding then removing a user from an organization
        """
        # Check user 2 is not in any orgs
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 0)
        # Create an org and then add user2
        org = self.create_organization(organization_name='org', client=self.client1)
        self.add_user_to_org(organization=org, user=self.user2.username, client=self.client1)
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org')
        self.assertEqual(org_list[0]['role'], 'Member')
        # Remove user 2 from the org and check they aren't seeing it anymore
        self.del_user_from_org(organization=org, user=self.user2.username, client=self.client1)
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 0)
        # Check what happens when the user tries to access the organization they were deleted from
        organization_details_url = f"/organization/{org['id']}/"
        response = self.client2.get(organization_details_url)
        self.assertEqual(response.status_code, 200)
        response = self.client2.get(organization_details_url, headers={'HTTP_ACCEPT': 'application/json'})
        self.assertEqual(response.status_code, 200)
        # Re-add the user and check that nothing explodes
        self.add_user_to_org(organization=org, user=self.user2.username, client=self.client1)
        org_list = self.get_my_organizations(client=self.client2)
        self.assertEqual(len(org_list), 1)
        response = self.client2.get(organization_details_url)
        self.assertEqual(response.status_code, 200)
        response = self.client2.get(organization_details_url, headers={'HTTP_ACCEPT': 'application/json'})
        self.assertEqual(response.status_code, 200)

    def test_organization_asset_add_list(self):
        """
        Test adding an asset to an organization
        """
        org = self.create_organization(organization_name='org', client=self.client1)
        asset_list = self.get_org_asset_list(organization=org, client=self.client1)
        self.assertEqual(len(asset_list), 0)
        asset_type = self.create_asset_type()
        asset = self.create_asset(name='asset1', asset_type=asset_type, owner=self.user1)
        self.add_asset_to_organization(asset=asset, organization=org)
        asset_list = self.get_org_asset_list(organization=org, client=self.client1)
        self.assertEqual(len(asset_list), 1)
        self.assertEqual(asset_list[0]['asset']['name'], 'asset1')
        org2 = self.create_organization(organization_name='org2', client=self.client1)
        asset_list = self.get_org_asset_list(organization=org2, client=self.client1)
        self.assertEqual(len(asset_list), 0)
        # Check non-members can't add assets
        asset2 = self.create_asset(name='asset2', asset_type=asset_type, owner=self.user2)
        self.add_asset_to_organization(asset=asset2, organization=org2, client=self.client2, expected_status=404)
        # Check only the asset owners can add assets
        self.add_asset_to_organization(asset=asset2, organization=org2, client=self.client1, expected_status=403)
        # Check general members cant add assets
        self.add_user_to_org(user=self.user2, organization=org2, role='M')
        self.add_asset_to_organization(asset=asset2, organization=org2, client=self.client2, expected_status=403)
        # Check that admins who didn't create the org can add assets
        self.add_user_to_org(user=self.user2, organization=org2, role='A')
        self.add_asset_to_organization(asset=asset2, organization=org2, client=self.client2)

    def test_organization_details(self):
        """
        Check the organization details (page)
        """
        org_name = 'my-test-org'
        org = self.create_organization(organization_name=org_name, client=self.client1)
        org_url = f"/organization/{org['id']}/"
        json_data = self.get_url_json(org_url)
        self.assertEqual(json_data['id'], org['id'])
        self.assertEqual(json_data['name'], org_name)
        self.assertEqual(len(json_data['members']), 1)
        self.assertEqual(json_data['members'][0]['user'], self.user1.username)
        # Add an asset and check the asset is included too
        asset_type = self.create_asset_type()
        asset = self.create_asset(name='asset1', asset_type=asset_type, owner=self.user1)
        self.add_asset_to_organization(asset=asset, organization=org)
        json_data = self.get_url_json(org_url)
        self.assertEqual(json_data['id'], org['id'])
        self.assertEqual(json_data['name'], org_name)
        self.assertEqual(len(json_data['members']), 1)
        self.assertEqual(json_data['members'][0]['user'], self.user1.username)
        self.assertEqual(len(json_data['assets']), 1)
        self.assertEqual(json_data['assets'][0]['added_by'], self.user1.username)
        self.assertEqual(json_data['assets'][0]['asset']['name'], 'asset1')
