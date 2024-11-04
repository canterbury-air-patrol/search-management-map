"""
Tests for the radio operator role
"""

from django.test import TestCase
from django.contrib.gis.geos import Point

from data.models import GeoTimeLabel

from smm.tests import SMMTestUsers
from assets.tests import AssetsHelpers
from mission.tests import MissionFunctions
from .tests import OrganizationFunctions


class RadioOperatorTestCase(TestCase):
    """
    Tests for radio operator functionality
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.orgs = OrganizationFunctions(self.smm)
        self.missions = MissionFunctions(self.smm)

    def test_0001_radio_operator(self):
        """
        Check access to the radio operator url
        """
        org1 = self.orgs.create_organization(client=self.smm.client1)
        # check the admin can access the radio operator url
        response = org1.get_radio_operator_ui(client=self.smm.client1)
        self.assertEqual(response.status_code, 200)
        # check a user who is not in the organization cannot access it
        response = org1.get_radio_operator_ui(client=self.smm.client2)
        self.assertEqual(response.status_code, 404)
        # check an unauthenticated client gets asked to authenticate
        response = org1.get_radio_operator_ui(client=self.smm.unauth_client)
        self.assertEqual(response.status_code, 302)

    def test_0002_radio_operator_role(self):
        """
        Check a user that has the radio operator role can access the radio operator url
        """
        org1 = self.orgs.create_organization(client=self.smm.client1)
        org1.add_user(self.smm.user2, role='R')
        response = org1.get_radio_operator_ui(client=self.smm.client2)
        self.assertEqual(response.status_code, 200)

    def test_0010_asset_details(self):
        """
        Check a radio operator can access the asset details
        """
        org1 = self.orgs.create_organization(client=self.smm.client1)
        asset1 = self.assets.create_asset()
        asset_details_url = f'/assets/{asset1.pk}/'
        response = self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        # check another user cannot access the details currently
        response = self.smm.client2.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        # Add the asset to the org
        org1.add_asset(asset1)
        response = self.smm.client2.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        # Check regular org members cannot access the asset details
        org1.add_user(self.smm.user2, role='M')
        response = self.smm.client2.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        # Check radio operators can access the details
        org1.add_user(self.smm.user2, role='R')
        response = self.smm.client2.get(asset_details_url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

    def test_0100_mission_asset_accept_search(self):
        """
        Check that a radio operator can accept a search on behalf of a half an asset
        """
        org1 = self.orgs.create_organization(client=self.smm.client1)
        asset_type = self.assets.create_asset_type()
        asset1 = self.assets.create_asset(asset_type=asset_type)
        org1.add_asset(asset1)
        mission = self.missions.create_mission('test_mission')
        mission.add_organization(org1)
        mission.add_asset(asset1)
        asset_details_url = f'/assets/{asset1.pk}/'
        self.smm.client1.get(asset_details_url, HTTP_ACCEPT='application/json').json()
        # Create the POI and search object
        poi = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), created_by=self.smm.user1, label='Test Point', geo_type='poi', mission=mission.get_object())
        sector_search_create = '/search/sector/create/'
        search_data = self.smm.client1.post(sector_search_create, {
            'poi_id': poi.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': 200
        }).json()
        search_queue_url = f"/search/{search_data['features'][0]['properties']['pk']}/queue/"
        self.smm.client1.post(search_queue_url, {'asset': asset1.pk})
        search_begin_url = f"/search/${search_data['features'][0]['properties']['pk']}/begin/"
        # Check a non-org member cannot do this
        response = self.smm.client2.get(search_begin_url)
        self.assertEqual(response.status_code, 404)
        # Check that an org member who is not a radio operator cannot do this
        org1.add_user(self.smm.user2, role='M')
        response = self.smm.client2.get(search_begin_url)
        self.assertEqual(response.status_code, 404)
        # Check that the radio operator can begin this search
        org1.add_user(self.smm.user2, role='R')
        response = self.smm.client2.get(search_begin_url)
        self.assertEqual(response.status_code, 404)
