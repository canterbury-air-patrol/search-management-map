"""
Tests for search creation/management
"""

from django.test import TestCase
from django.contrib.gis.geos import Point, LineString, Polygon

from data.models import GeoTimeLabel

from smm.tests import SMMTestUsers

from assets.tests import AssetsHelpers
from mission.tests import MissionFunctions

from .models import Search


class SearchWrapper:
    """
    Wrapper for search objects
    """
    def __init__(self, smm, search_data):
        self.smm = smm
        self.search_id = search_data['features'][0]['properties']['pk']

    def as_object(self):
        """
        Get the object for this search
        """
        return Search.objects.get(pk=self.search_id)

    def queue(self, asset=None, client=None):
        """
        Queue this search
        If no asset is passed, it will be queued for the asset type
        """
        if client is None:
            client = self.smm.client1
        data = {}
        if asset is not None:
            data['asset'] = asset.pk
        return client.post(f'/search/{self.search_id}/queue/', data=data)

    def delete(self, client=None):
        """
        Delete this search
        """
        if client is None:
            client = self.smm.client1
        return client.delete(f'/search/{self.search_id}/')

    def details(self, client=None):
        """
        Get the details of this search
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/search/{self.search_id}/')

    def json(self, client=None):
        """
        Get the json version of this search
        """
        if client is None:
            client = self.smm.client1
        return client.get(f'/search/{self.search_id}/', HTTP_ACCEPT='application/json')

    def begin(self, client=None):
        """
        Begin this search
        """
        if client is None:
            client = self.smm.client1
        return client.post(f'/search/{self.search_id}/begin/')

    def finished(self, client=None):
        """
        Mark this search as finished
        """
        if client is None:
            client = self.smm.client1
        return client.post(f'/search/{self.search_id}/details/')


class SearchHelpers:
    """
    Helper functions for dealing with a search
    """
    def __init__(self, smm):
        self.smm = smm

    def create_sector(self, poi, sweep_width, asset_type, client=None):
        """
        Create a sector search
        """
        if client is None:
            client = self.smm.client1
        response = client.post('/search/sector/create/', data={
            'poi_id': poi.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': sweep_width
        })
        return SearchWrapper(self.smm, response.json())

    def create_expanding_box_search(self, poi, sweep_width, iterations, asset_type, first_bearing=None, client=None):
        # pylint: disable=R0913,R0917
        """
        Create an expanding box search
        """
        if client is None:
            client = self.smm.client1
        data = {
            'poi_id': poi.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': sweep_width,
            'iterations': iterations,
        }
        if first_bearing is not None:
            data['first_bearing'] = first_bearing
        response = client.post('/search/expandingbox/create/', data=data)
        return SearchWrapper(self.smm, response.json())

    def create_trackline_search(self, line, sweep_width, asset_type, client=None):
        """
        Create a track line search
        """
        if client is None:
            client = self.smm.client1
        response = client.post('/search/trackline/create/', data={
            'line_id': line.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': sweep_width
        })
        return SearchWrapper(self.smm, response.json())

    def create_shoreline_search(self, line, sweep_width, asset_type, client=None):
        """
        Create a shore line search
        """
        if client is None:
            client = self.smm.client1
        response = client.post('/search/shoreline/create/', data={
            'line_id': line.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': sweep_width
        })
        return SearchWrapper(self.smm, response.json())

    def create_creepingline_search_line(self, line, sweep_width, search_width, asset_type, client=None):
        # pylint: disable=R0913,R0917
        """
        Create a creeping line search from a line
        """
        if client is None:
            client = self.smm.client1
        response = client.post('/search/creepingline/create/track/', data={
            'line_id': line.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': sweep_width,
            'width': search_width,
        })
        return SearchWrapper(self.smm, response.json())

    def create_creepingline_search_polygon(self, polygon, sweep_width, asset_type, client=None):
        """
        Create a creeping line search from a line
        """
        if client is None:
            client = self.smm.client1
        response = client.post('/search/creepingline/create/polygon/', data={
            'poly_id': polygon.pk,
            'asset_type_id': asset_type.pk,
            'sweep_width': sweep_width,
        })
        return SearchWrapper(self.smm, response.json())

    def find_closest(self, lat, long, asset, client=None):
        """
        Find the closest search by distance
        """
        if client is None:
            client = self.smm.client1
        return client.get('/search/find/closest/', data={
            'latitude': lat,
            'longitude': long,
            'asset_id': asset.pk,
        })


#    re_path(r'^mission/(?P<mission_id>\d+)/search/notstarted/$', views.search_notstarted, {'search_class': Search}, name='search_notstarted'),
#    re_path(r'^mission/(?P<mission_id>\d+)/search/notstarted/kml/$', views.search_notstarted_kml, {'search_class': Search}, name='search_notstarted_kml'),
#    re_path(r'^mission/(?P<mission_id>\d+)/search/inprogress/$', views.search_inprogress, {'search_class': Search}, name='search_inprogress'),
#    re_path(r'^mission/(?P<mission_id>\d+)/search/inprogress/kml/$', views.search_inprogress_kml, {'search_class': Search}, name='search_inprogress_kml'),
#    re_path(r'^mission/(?P<mission_id>\d+)/search/completed/$', views.search_completed, {'search_class': Search}, name='search_completed'),
#    re_path(r'^mission/(?P<mission_id>\d+)/search/completed/kml/$', views.search_completed_kml, {'search_class': Search}, name='search_completed_kml'),
#    re_path(r'^mission/all/search/notstarted/$', views.search_notstarted_user, {'search_class': Search, 'current_only': False}),
#    re_path(r'^mission/all/search/inprogress/$', views.search_inprogress_user, {'search_class': Search, 'current_only': False}),
#    re_path(r'^mission/all/search/completed/$', views.search_completed_user, {'search_class': Search, 'current_only': False}),
#    re_path(r'^mission/current/search/notstarted/$', views.search_notstarted_user, {'search_class': Search, 'current_only': True}),
#    re_path(r'^mission/current/search/inprogress/$', views.search_inprogress_user, {'search_class': Search, 'current_only': True}),
#    re_path(r'^mission/current/search/completed/$', views.search_completed_user, {'search_class': Search, 'current_only': True}),

class SearchTestCase(TestCase):
    """
    Tests for search functionality
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.searches = SearchHelpers(self.smm)
        self.missions = MissionFunctions(self.smm)
        self.asset_type1 = self.assets.create_asset_type()
        self.asset1 = self.assets.create_asset(asset_type=self.asset_type1)
        self.mission1 = self.missions.create_mission('test mission')
        self.mission1.add_asset(self.asset1)

    def create_poi(self, lat, long, label='Test Point', user=None, mission=None):
        # pylint: disable=R0913,R0917
        """
        Create a POI at lat/long
        """
        if user is None:
            user = self.smm.user1
        if mission is None:
            mission = self.mission1
        return GeoTimeLabel.objects.create(geo=Point(long, lat), created_by=user, label=label, geo_type='poi', mission=mission.get_object())

    def create_line(self, points, label='Test Line', user=None, mission=None):
        """
        Create a Line from the points
        """
        if user is None:
            user = self.smm.user1
        if mission is None:
            mission = self.mission1
        return GeoTimeLabel.objects.create(geo=LineString(points), created_by=user, label=label, geo_type='line', mission=mission.get_object())

    def create_polygon(self, points, label='Test Polygon', user=None, mission=None):
        """
        Create a Polygon from the points
        """
        if user is None:
            user = self.smm.user1
        if mission is None:
            mission = self.mission1
        return GeoTimeLabel.objects.create(geo=Polygon(points), created_by=user, label=label, geo_type='polygon', mission=mission.get_object())

    def test_0100_create_sector_basic(self):
        """
        Test creating a sector search
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, poi.pk)
        self.assertEqual(search.search_type, 'Sector')
        self.assertEqual(search.iterations, None)
        self.assertEqual(search.first_bearing, None)
        self.assertEqual(search.width, None)

    def test_0200_create_expanding_box_basic(self):
        """
        Test creating an expanding box search
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_expanding_box_search(poi, 200, 2, self.asset_type1, first_bearing=90).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, poi.pk)
        self.assertEqual(search.search_type, 'Expanding Box')
        self.assertEqual(search.iterations, 2)
        self.assertEqual(search.first_bearing, 90)
        self.assertEqual(search.width, None)

    def test_0201_create_expanding_box_no_first_bearing(self):
        """
        Test creating an expanding box search
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_expanding_box_search(poi, 200, 2, self.asset_type1).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, poi.pk)
        self.assertEqual(search.search_type, 'Expanding Box')
        self.assertEqual(search.iterations, 2)
        self.assertEqual(search.first_bearing, 0)
        self.assertEqual(search.width, None)

    def test_0300_create_trackline_basic(self):
        """
        Test creating a trackline search
        """
        line = self.create_line(((172.5, -43.5), (172.6, -43.6)))
        search = self.searches.create_trackline_search(line, 200, self.asset_type1).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, line.pk)
        self.assertEqual(search.search_type, 'Track Line')
        self.assertEqual(search.iterations, None)
        self.assertEqual(search.first_bearing, None)
        self.assertEqual(search.width, None)

    def test_0400_create_creepingline_line_basic(self):
        """
        Test creating a creepingline search from line
        """
        line = self.create_line(((172.5, -43.5), (172.6, -43.6)))
        search = self.searches.create_creepingline_search_line(line, 200, 1000, self.asset_type1).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, line.pk)
        self.assertEqual(search.search_type, 'Creeping Line')
        self.assertEqual(search.iterations, None)
        self.assertEqual(search.first_bearing, None)
        self.assertEqual(search.width, 1000)

    def test_0500_create_creepingline_polygon_basic(self):
        """
        Test creating a creepingline search from polygon
        """
        polygon = self.create_polygon(((172.5, -43.5), (172.5, -43.6), (172.6, -43.6), (172.6, -43.5), (172.5, -43.5)))
        search = self.searches.create_creepingline_search_polygon(polygon, 200, self.asset_type1).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, polygon.pk)
        self.assertEqual(search.search_type, 'Parallel Line')
        self.assertEqual(search.iterations, None)
        self.assertEqual(search.first_bearing, None)
        self.assertEqual(search.width, None)

    def test_0600_create_shoreline_basic(self):
        """
        Test creating a shoreline search
        """
        line = self.create_line(((172.5, -43.5), (172.6, -43.6)))
        search = self.searches.create_shoreline_search(line, 200, self.asset_type1).as_object()
        self.assertEqual(search.created_for, self.asset_type1)
        self.assertEqual(search.sweep_width, 200)
        self.assertEqual(search.inprogress_by, None)
        self.assertEqual(search.inprogress_at, None)
        self.assertEqual(search.completed_by, None)
        self.assertEqual(search.completed_at, None)
        self.assertEqual(search.queued_at, None)
        self.assertEqual(search.queued_for_asset, None)
        self.assertEqual(search.datum.pk, line.pk)
        self.assertEqual(search.search_type, 'Shore Line')
        self.assertEqual(search.iterations, None)
        self.assertEqual(search.first_bearing, None)
        self.assertEqual(search.width, None)

    def test_1000_check_find_next_creation_time(self):
        """
        Test finding the next search when the only difference is creation time
        This should always pick the closest search to the location
        so if we pass in the exact location of the poi, we should get that search
        """
        poi1 = self.create_poi(-43.5, 172.5)
        search1 = self.searches.create_expanding_box_search(poi1, 200, 2, self.asset_type1, first_bearing=90).as_object()
        poi2 = self.create_poi(-44.5, 173.5)
        search2 = self.searches.create_expanding_box_search(poi2, 200, 2, self.asset_type1, first_bearing=180).as_object()
        response = self.searches.find_closest(-43.5, 172.5, self.asset1)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Check we get the search we expected based on this location
        self.assertEqual(data['object_url'], f'/search/{search1.pk}/')
        self.assertEqual(data['distance'], 0)
        # Try the other location
        response = self.searches.find_closest(-44.5, 173.5, self.asset1)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Check we get the search we expected based on this location
        self.assertEqual(data['object_url'], f'/search/{search2.pk}/')
        self.assertEqual(data['distance'], 0)

    def test_1001_check_queued_asset_type(self):
        """
        Test finding the next search when one of them is queued for the asset type
        This should always find the queued search
        """
        poi1 = self.create_poi(-43.5, 172.5)
        self.searches.create_expanding_box_search(poi1, 200, 2, self.asset_type1, first_bearing=90).as_object()
        poi2 = self.create_poi(-44.5, 173.5)
        search2 = self.searches.create_expanding_box_search(poi2, 200, 2, self.asset_type1, first_bearing=180)
        search2_obj = search2.as_object()
        search2.queue()
        response = self.searches.find_closest(-43.5, 172.5, self.asset1)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Check we get the search we expected based on this location
        self.assertEqual(data['object_url'], f'/search/{search2_obj.pk}/')
        self.assertNotEqual(data['distance'], 0)
        # Try the other location
        response = self.searches.find_closest(-44.5, 173.5, self.asset1)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Check we get the search we expected based on this location
        self.assertEqual(data['object_url'], f'/search/{search2_obj.pk}/')
        self.assertEqual(data['distance'], 0)

    def test_1010_check_invalid_closest_queries(self):
        """
        Test that invalid queries for find closest get a failure
        """
        poi1 = self.create_poi(-43.5, 172.5)
        self.searches.create_expanding_box_search(poi1, 200, 2, self.asset_type1, first_bearing=90).as_object()
        response = self.searches.find_closest(-43.5, 172.5, self.asset1, client=self.smm.client2)
        self.assertEqual(response.status_code, 403)
        response = self.smm.client1.put('/search/find/closest/', data={
            'latitude': -43.5,
            'longitude': 172.5,
            'asset_id': self.asset1.pk,
        })
        self.assertEqual(response.status_code, 405)
