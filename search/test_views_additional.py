from django.contrib.gis.geos import Point
from django.test import TestCase
from django.utils import timezone

from smm.tests import SMMTestUsers
from assets.tests import AssetsHelpers
from mission.tests import MissionFunctions
from data.models import GeoTimeLabel

from .models import Search, SearchParams
from .views import check_search_state


class SearchViewsAdditionalTest(TestCase):
    def setUp(self):
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.missions = MissionFunctions(self.smm)
        self.asset_type = self.assets.create_asset_type()
        self.asset1 = self.assets.create_asset(asset_type=self.asset_type)
        self.asset2 = self.assets.create_asset(asset_type=self.asset_type)
        self.mission = self.missions.create_mission('test mission')
        self.mission.add_asset(self.asset1)
        self.mission.add_asset(self.asset2)

    def create_poi(self, lat, long, user=None, mission=None):
        if user is None:
            user = self.smm.user1
        if mission is None:
            mission = self.mission
        return GeoTimeLabel.objects.create(geo=Point(long, lat), created_by=user, label='t', geo_type='poi', mission=mission.get_object())

    def test_check_search_state_deleted(self):
        poi = self.create_poi(-43.5, 172.5)
        search = Search.create_sector_search(SearchParams(poi, self.asset_type, self.smm.user1, 100), save=True)
        # deleted
        search.deleted_at = timezone.now()
        resp = check_search_state(search, 'begin', self.asset1)
        self.assertEqual(resp.status_code, 403)

    def test_check_search_state_replaced(self):
        poi = self.create_poi(-43.5, 172.5)
        search = Search.create_sector_search(SearchParams(poi, self.asset_type, self.smm.user1, 100), save=True)
        # mark as replaced (attribute access is sufficient for the check)
        search.replaced_by = object()
        resp = check_search_state(search, 'begin', self.asset1)
        self.assertEqual(resp.status_code, 404)

    def test_check_search_state_completed(self):
        poi = self.create_poi(-43.5, 172.5)
        search = Search.create_sector_search(SearchParams(poi, self.asset_type, self.smm.user1, 100), save=True)
        search.completed_at = timezone.now()
        resp = check_search_state(search, 'begin', self.asset1)
        self.assertEqual(resp.status_code, 403)

    def test_check_search_state_begin_conflict(self):
        poi = self.create_poi(-43.5, 172.5)
        search = Search.create_sector_search(SearchParams(poi, self.asset_type, self.smm.user1, 100), save=True)
        # someone else has it in progress
        search.inprogress_by = self.asset2
        resp = check_search_state(search, 'begin', self.asset1)
        self.assertEqual(resp.status_code, 403)

    def test_check_search_state_delete_inprogress(self):
        poi = self.create_poi(-43.5, 172.5)
        search = Search.create_sector_search(SearchParams(poi, self.asset_type, self.smm.user1, 100), save=True)
        search.inprogress_by = self.asset2
        resp = check_search_state(search, 'delete', None)
        self.assertEqual(resp.status_code, 403)

    def test_check_search_state_complete_not_inprogress(self):
        poi = self.create_poi(-43.5, 172.5)
        search = Search.create_sector_search(SearchParams(poi, self.asset_type, self.smm.user1, 100), save=True)
        # not in progress -> cannot complete
        resp = check_search_state(search, 'complete', self.asset1)
        self.assertEqual(resp.status_code, 403)

    def test_find_next_search_no_search_and_invalid_lat(self):
        # no searches exist -> should return 404
        response = self.smm.client1.get('/search/find/closest/', data={
            'latitude': -43.5,
            'longitude': 172.5,
            'asset_id': self.asset1.pk,
        })
        self.assertEqual(response.status_code, 404)

        # invalid latitude -> 400
        response = self.smm.client1.get('/search/find/closest/', data={
            'latitude': 'not-a-number',
            'longitude': 172.5,
            'asset_id': self.asset1.pk,
        })
        self.assertEqual(response.status_code, 400)
