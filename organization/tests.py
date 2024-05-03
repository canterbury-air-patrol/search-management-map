"""
Tests for Organizations
"""

from django.test import TestCase

from smm.tests import SMMTestUsers

from assets.models import Asset, AssetType


class OrganizationWrapper:
    """
    Wrapper function for an organization
    """
    def __init__(self, smm, org_id):
        self.smm = smm
        self.org_id = org_id

    def get_url_json(self, url, client=None):
        """
        Get the response from a url as json
        """
        if client is None:
            client = self.smm.client1
        return client.get(url, HTTP_ACCEPT='application/json')

    def add_user(self, user=None, client=None, role='M'):
        """
        Add a user to an organization
        """
        if client is None:
            client = self.smm.client1
        return client.post(f'/organization/{self.org_id}/user/{user}/', {'role': role})

    def remove_user(self, user=None, client=None):
        """
        Remove a user from the organization
        """
        if client is None:
            client = self.smm.client1
        response = client.delete(f'/organization/{self.org_id}/user/{user}/')

    def get_details(self, client=None):
        """
        Get the details of this organization
        """
        return self.get_url_json(f'/organization/{self.org_id}/', client=client)

    def get_details_page(self, client=None):
        """
        Get the details of this organization
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/organization/{self.org_id}/', client=client)

    def get_org_asset_list(self, client=None):
        """
        Get the list of assets in an organization
        """
        if client is None:
            client = self.smm.client1
        json_data = self.get_url_json(f'/organization/{self.org_id}/assets/', client).json()
        return json_data['assets']

    def add_asset(self, asset, client=None):
        """
        Add an asset to an organization
        """
        if client is None:
            client = self.smm.client1
        return client.post(f'/organization/{self.org_id}/assets/{asset.pk}/', {})


class OrganizationFunctions:
    """
    Helper functions for dealing with organizations
    """
    def __init__(self, smm):
        self.smm = smm

    def create_organization(self, organization_name='org', client=None):
        """
        Create an organization
        """
        organization_create_url = '/organization/create/'
        if client is None:
            client = self.smm.client1
        data = client.post(organization_create_url, {'name': organization_name}).json()
        return OrganizationWrapper(self.smm, data['id'])

    def get_url_json(self, url, client=None):
        """
        Get the response from a url as json
        """
        if client is None:
            client = self.smm.client1
        response = client.get(url, HTTP_ACCEPT='application/json')
        return response.json()

    def get_all_organizations(self, client=None):
        """
        Get all the organizations
        """
        organization_list_all_url = '/organization/list/all/'
        json_data = self.get_url_json(organization_list_all_url, client=client)
        return json_data['organizations']

    def get_my_organizations(self, client=None):
        """
        Get any organizations the current user is in
        """
        organization_list_mine_url = '/organization/list/mine/'
        json_data = self.get_url_json(organization_list_mine_url, client=client)
        return json_data['organizations']


class OrganizationTestCase(TestCase):
    """
    Test Organizations API
    """
    def setUp(self):
        """
        Create the required users
        """
        self.smm = SMMTestUsers()
        self.orgs = OrganizationFunctions(self.smm)

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
            owner = self.smm.user1
        Asset(name=name, asset_type=asset_type, owner=owner).save()
        return Asset.objects.get(name=name)

    def test_organization_create(self):
        """
        Test creating organizations
        """
        organization_create_url = '/organization/create/'
        organization_name = 'org1'
        alt_organization_name = 'alt org'
        # Check that get cannot be used
        response = self.smm.client1.get(organization_create_url, {'name': organization_name})
        self.assertEqual(response.status_code, 405)
        # Check that post can be used
        response = self.smm.client1.post(organization_create_url, {'name': organization_name})
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data['name'], organization_name)
        self.assertEqual(json_data['creator'], self.smm.user1.username)
        # That attempting to create the same organization fails
        response = self.smm.client1.post(organization_create_url, {'name': organization_name})
        self.assertNotEqual(response.status_code, 200)
        # That creating an organization with a new name is allowed
        org2 = self.orgs.create_organization(organization_name=alt_organization_name, client=self.smm.client1)
        json_data = org2.get_details().json()
        self.assertEqual(json_data['name'], alt_organization_name)
        self.assertEqual(json_data['creator'], self.smm.user1.username)
        self.assertEqual(json_data['role'], 'Admin')

    def test_organization_lists(self):
        """
        Test the users organization list
        """
        # Check there are currently no organizations listed
        org_list = self.orgs.get_all_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 0)
        org_list = self.orgs.get_all_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 0)
        # Create an organization for each user
        org1 = self.orgs.create_organization(organization_name='org1', client=self.smm.client1)
        org2 = self.orgs.create_organization(organization_name='org2', client=self.smm.client2)
        # Check they both show up in the all list
        org_list = self.orgs.get_all_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 2)
        org_list = self.orgs.get_all_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 2)
        # Check the mine list only shows the correct org for each user
        org_list = self.orgs.get_my_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org1')
        self.assertEqual(org_list[0]['role'], 'Admin')
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org2')
        self.assertEqual(org_list[0]['role'], 'Admin')

    def test_organization_user_add(self):
        """
        Test adding a user to an organization
        """
        # Check user 2 is not in any orgs
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 0)
        # Create an org and then add user2
        org = self.orgs.create_organization(organization_name='org', client=self.smm.client1)
        org.add_user(user=self.smm.user2.username, client=self.smm.client1)
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org')
        self.assertEqual(org_list[0]['role'], 'Member')
        # get user2 to create an org and then add user1 to it
        org_list = self.orgs.get_my_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['role'], 'Admin')
        # create the new org for user2
        org = self.orgs.create_organization(organization_name='org2', client=self.smm.client2)
        # Check user1 can't see it currently
        org_list = self.orgs.get_my_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['role'], 'Admin')
        # Check user1 can't add themselves
        response = org.add_user(user=self.smm.user1, client=self.smm.client1)
        # should get a 404 if they aren't in the organization
        self.assertEqual(response.status_code, 404)
        org_list = self.orgs.get_my_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 1)
        # Add user1
        org.add_user(user=self.smm.user1.username, client=self.smm.client2)
        org_list = self.orgs.get_my_organizations(client=self.smm.client1)
        self.assertEqual(len(org_list), 2)
        self.assertEqual(org_list[1]['role'], 'Member')
        # Check that user1 attempting to admin themself results in 403
        response = org.add_user(user=self.smm.user1, client=self.smm.client1, role='M')
        self.assertEqual(response.status_code, 403)

    def test_organization_user_remove(self):
        """
        Test adding then removing a user from an organization
        """
        # Check user 2 is not in any orgs
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 0)
        # Create an org and then add user2
        org = self.orgs.create_organization(organization_name='org', client=self.smm.client1)
        org.add_user(user=self.smm.user2.username, client=self.smm.client1)
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 1)
        self.assertEqual(org_list[0]['name'], 'org')
        self.assertEqual(org_list[0]['role'], 'Member')
        # Remove user 2 from the org and check they aren't seeing it anymore
        org.remove_user(user=self.smm.user2.username, client=self.smm.client1)
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 0)
        # Check what happens when the user tries to access the organization they were deleted from
        response = org.get_details_page(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        response = org.get_details(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        # Re-add the user and check that nothing explodes
        org.add_user(user=self.smm.user2.username, client=self.smm.client1)
        org_list = self.orgs.get_my_organizations(client=self.smm.client2)
        self.assertEqual(len(org_list), 1)
        response = org.get_details_page(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)
        response = org.get_details(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)

    def test_organization_asset_add_list(self):
        """
        Test adding an asset to an organization
        """
        org = self.orgs.create_organization(organization_name='org', client=self.smm.client1)
        asset_list = org.get_org_asset_list(client=self.smm.client1)
        self.assertEqual(len(asset_list), 0)
        asset_type = self.create_asset_type()
        asset = self.create_asset(name='asset1', asset_type=asset_type, owner=self.smm.user1)
        org.add_asset(asset=asset)
        asset_list = org.get_org_asset_list(client=self.smm.client1)
        self.assertEqual(len(asset_list), 1)
        self.assertEqual(asset_list[0]['asset']['name'], 'asset1')
        org2 = self.orgs.create_organization(organization_name='org2', client=self.smm.client1)
        asset_list = org2.get_org_asset_list(client=self.smm.client1)
        self.assertEqual(len(asset_list), 0)
        # Check non-members can't add assets
        asset2 = self.create_asset(name='asset2', asset_type=asset_type, owner=self.smm.user2)
        response = org2.add_asset(asset2, client=self.smm.client2)
        self.assertEqual(response.status_code, 404)
        # Check only the asset owners can add assets
        response = org2.add_asset(asset2, client=self.smm.client1)
        self.assertEqual(response.status_code, 403)
        # Check general members cant add assets
        org2.add_user(user=self.smm.user2, role='M')
        response = org2.add_asset(asset2, client=self.smm.client2)
        self.assertEqual(response.status_code, 403)
        # Check that admins who didn't create the org can add assets
        org2.add_user(self.smm.user2, role='A')
        response = org2.add_asset(asset2, client=self.smm.client2)
        self.assertEqual(response.status_code, 200)

    def test_organization_details(self):
        """
        Check the organization details (page)
        """
        org_name = 'my-test-org'
        org = self.orgs.create_organization(organization_name=org_name, client=self.smm.client1)
        json_data = org.get_details().json()
        self.assertEqual(json_data['id'], org.org_id)
        self.assertEqual(json_data['name'], org_name)
        self.assertEqual(len(json_data['members']), 1)
        self.assertEqual(json_data['members'][0]['user'], self.smm.user1.username)
        # Add an asset and check the asset is included too
        asset_type = self.create_asset_type()
        asset = self.create_asset(name='asset1', asset_type=asset_type, owner=self.smm.user1)
        org.add_asset(asset)
        json_data = org.get_details().json()
        self.assertEqual(json_data['id'], org.org_id)
        self.assertEqual(json_data['name'], org_name)
        self.assertEqual(len(json_data['members']), 1)
        self.assertEqual(json_data['members'][0]['user'], self.smm.user1.username)
        self.assertEqual(len(json_data['assets']), 1)
        self.assertEqual(json_data['assets'][0]['added_by'], self.smm.user1.username)
        self.assertEqual(json_data['assets'][0]['asset']['name'], 'asset1')
