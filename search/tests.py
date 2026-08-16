"""
Tests for search creation/management
"""

from django.test import TestCase
from django.utils import timezone
from django.contrib.gis.geos import Point, LineString, Polygon

from data.models import GeoTimeLabel

from smm.tests import SMMTestUsers

from assets.tests import AssetsHelpers
from mission.tests import MissionFunctions
from timeline.models import TimeLineEntry

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

    def unqueue(self, client=None):
        """
        Remove this search from the queue
        """
        if client is None:
            client = self.smm.client1
        return client.delete(f'/search/{self.search_id}/queue/')

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

    def begin(self, asset=None, client=None):
        """
        Begin this search
        """
        if client is None:
            client = self.smm.client1
        data = {}
        if asset is not None:
            data['asset_id'] = asset.pk
        return client.post(f'/search/{self.search_id}/begin/', data=data)

    def finished(self, asset=None, client=None):
        """
        Mark this search as finished
        """
        if client is None:
            client = self.smm.client1
        data = {}
        if asset is not None:
            data['asset_id'] = asset.pk
        return client.post(f'/search/{self.search_id}/finished/', data=data)


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

    def test_1100_queue_rejects_get(self):
        """
        Queueing a search mutates state, so GET must be rejected (CSRF safe method).
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1)
        response = self.smm.client1.get(f'/search/{search.search_id}/queue/')
        self.assertEqual(response.status_code, 405)
        self.assertIsNone(search.as_object().queued_at)

    def test_1101_queue_via_post(self):
        """
        Queueing a search via POST still works.
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1)
        response = self.smm.client1.post(f'/search/{search.search_id}/queue/', data={})
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(search.as_object().queued_at)

    def test_1102_begin_rejects_get(self):
        """
        Beginning a search mutates state, so GET must be rejected.
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1)
        response = self.smm.client1.get(f'/search/{search.search_id}/begin/', data={'asset_id': self.asset1.pk})
        self.assertEqual(response.status_code, 405)
        self.assertIsNone(search.as_object().inprogress_by)

    def test_1103_begin_via_post(self):
        """
        Beginning a search via POST still works.
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1)
        response = self.smm.client1.post(f'/search/{search.search_id}/begin/', data={'asset_id': self.asset1.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(search.as_object().inprogress_by, self.asset1)

    def test_1104_finished_rejects_get(self):
        """
        Finishing a search mutates state, so GET must be rejected.
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1)
        self.smm.client1.post(f'/search/{search.search_id}/begin/', data={'asset_id': self.asset1.pk})
        response = self.smm.client1.get(f'/search/{search.search_id}/finished/', data={'asset_id': self.asset1.pk})
        self.assertEqual(response.status_code, 405)
        self.assertIsNone(search.as_object().completed_at)

    def test_1105_finished_via_post(self):
        """
        Finishing a search via POST still works.
        """
        poi = self.create_poi(-43.5, 172.5)
        search = self.searches.create_sector(poi, 200, self.asset_type1)
        self.smm.client1.post(f'/search/{search.search_id}/begin/', data={'asset_id': self.asset1.pk})
        response = self.smm.client1.post(f'/search/{search.search_id}/finished/', data={'asset_id': self.asset1.pk})
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(search.as_object().completed_at)


class SearchStateTransitionTestCase(TestCase):
    """
    Tests for invalid search state transitions.
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.searches = SearchHelpers(self.smm)
        self.missions = MissionFunctions(self.smm)
        self.asset_type = self.assets.create_asset_type()
        self.asset = self.assets.create_asset(asset_type=self.asset_type)
        self.mission = self.missions.create_mission('test mission')
        self.mission.add_asset(self.asset)

    def create_poi(self):
        """
        Create a POI for the test mission.
        """
        return GeoTimeLabel.objects.create(
            geo=Point(172.5, -43.5),
            created_by=self.smm.user1,
            label='Test Point',
            geo_type='poi',
            mission=self.mission.get_object(),
        )

    def create_search(self):
        """
        Create a sector search for state-transition tests.
        """
        return self.searches.create_sector(self.create_poi(), 200, self.asset_type)

    def test_begin_rejects_completed_search_without_reopening(self):
        """
        A completed search must not be moved back into progress.
        """
        search = self.create_search()
        search_obj = search.as_object()
        search_obj.completed_at = timezone.now()
        search_obj.completed_by = self.asset
        search_obj.save()

        response = search.begin(asset=self.asset)

        self.assertEqual(response.status_code, 403)
        search_obj.refresh_from_db()
        self.assertIsNone(search_obj.inprogress_at)
        self.assertIsNone(search_obj.inprogress_by)

    def test_begin_rejects_replaced_search_without_reopening(self):
        """
        A replaced search must not be moved back into progress.
        """
        search = self.create_search()
        search_obj = search.as_object()
        search_obj.replaced_at = timezone.now()
        search_obj.save()

        response = search.begin(asset=self.asset)

        self.assertEqual(response.status_code, 404)
        search_obj.refresh_from_db()
        self.assertIsNone(search_obj.inprogress_at)
        self.assertIsNone(search_obj.inprogress_by)

    def test_model_begin_rejects_terminal_search_without_reopening(self):
        """
        Direct model calls use the same terminal-state guard as the view.
        """
        search = self.create_search().as_object()
        search.completed_at = timezone.now()
        search.completed_by = self.asset
        search.save()

        changed = search.set_inprogress_by(self.asset, self.smm.user1)

        self.assertFalse(changed)
        search.refresh_from_db()
        self.assertIsNone(search.inprogress_at)
        self.assertIsNone(search.inprogress_by)

    def test_begin_rejects_completed_by_only_search_without_reopening(self):
        """
        A partially completed search record is still terminal.
        """
        search = self.create_search()
        search_obj = search.as_object()
        search_obj.completed_by = self.asset
        search_obj.save()

        response = search.begin(asset=self.asset)

        self.assertEqual(response.status_code, 403)
        search_obj.refresh_from_db()
        self.assertIsNone(search_obj.inprogress_at)
        self.assertIsNone(search_obj.inprogress_by)


class SearchQueueTestCase(TestCase):
    """
    Tests for queue lifecycle changes.
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.searches = SearchHelpers(self.smm)
        self.missions = MissionFunctions(self.smm)
        self.asset_type = self.assets.create_asset_type()
        self.asset = self.assets.create_asset(asset_type=self.asset_type)
        self.mission = self.missions.create_mission('test mission')
        self.mission.add_asset(self.asset)

    def create_poi(self):
        """
        Create a POI for the test mission.
        """
        return GeoTimeLabel.objects.create(
            geo=Point(172.5, -43.5),
            created_by=self.smm.user1,
            label='Test Point',
            geo_type='poi',
            mission=self.mission.get_object(),
        )

    def create_search(self):
        """
        Create a sector search for queue tests.
        """
        return self.searches.create_sector(self.create_poi(), 200, self.asset_type)

    def test_unqueue_via_delete(self):
        """
        A queued search can be removed from the queue with DELETE.
        """
        search = self.create_search()
        response = search.queue(asset=self.asset)
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(search.as_object().queued_at)
        self.assertEqual(search.as_object().queued_for_asset, self.asset)
        queue_entry = TimeLineEntry.objects.filter(event_type='que').order_by('-pk').first()
        self.assertIsNotNone(queue_entry)
        self.assertIn("Queued Search", queue_entry.message)

        response = search.unqueue()

        self.assertEqual(response.status_code, 200)
        search_obj = search.as_object()
        self.assertIsNone(search_obj.queued_at)
        self.assertIsNone(search_obj.queued_for_asset)
        timeline_entry = TimeLineEntry.objects.filter(event_type='unq').order_by('-pk').first()
        self.assertIsNotNone(timeline_entry)
        self.assertIn("Unqueued Search", timeline_entry.message)

    def test_unqueue_rejects_not_queued_search(self):
        """
        Removing a search that is not queued should be rejected.
        """
        search = self.create_search()

        response = search.unqueue()

        self.assertEqual(response.status_code, 403)
        self.assertIsNone(search.as_object().queued_at)

    def test_unqueue_rejects_inprogress_search(self):
        """
        A queued search cannot be unqueued once an asset has started it.
        """
        search = self.create_search()
        self.assertEqual(search.queue().status_code, 200)
        self.assertEqual(search.begin(asset=self.asset).status_code, 200)

        response = search.unqueue()

        self.assertEqual(response.status_code, 403)
        self.assertIsNotNone(search.as_object().queued_at)


class SearchCreateMembershipTestCase(TestCase):
    """
    Search creation/preview must verify the user is a member of the datum's mission.
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        self.assets = AssetsHelpers(self.smm)
        self.missions = MissionFunctions(self.smm)
        self.asset_type = self.assets.create_asset_type()
        # A mission owned by user2 that user1 is not a member of
        self.other_mission = self.missions.create_mission('other mission', client=self.smm.client2)

    def _other_geo(self, geo, geo_type):
        """Create a geometry owned by user2 in the mission user1 is not a member of."""
        return GeoTimeLabel.objects.create(geo=geo, created_by=self.smm.user2, label='datum', geo_type=geo_type, mission=self.other_mission.get_object())

    def test_create_sector_rejects_non_member_datum(self):
        """Creating a search against another mission's POI returns 404."""
        poi = self._other_geo(Point(172.5, -43.5), 'poi')
        response = self.smm.client1.post('/search/sector/create/', data={
            'poi_id': poi.pk, 'asset_type_id': self.asset_type.pk, 'sweep_width': 200,
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Search.objects.count(), 0)

    def test_preview_sector_rejects_non_member_datum(self):
        """The GET preview path also rejects another mission's POI."""
        poi = self._other_geo(Point(172.5, -43.5), 'poi')
        response = self.smm.client1.get('/search/sector/create/', data={
            'poi_id': poi.pk, 'asset_type_id': self.asset_type.pk, 'sweep_width': 200,
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Search.objects.count(), 0)

    def test_create_trackline_rejects_non_member_datum(self):
        """Line-datum searches reject a line from a mission the user is not in."""
        line = self._other_geo(LineString((172.5, -43.5), (172.6, -43.6)), 'line')
        response = self.smm.client1.post('/search/trackline/create/', data={
            'line_id': line.pk, 'asset_type_id': self.asset_type.pk, 'sweep_width': 200,
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Search.objects.count(), 0)

    def test_create_polygon_creepingline_rejects_non_member_datum(self):
        """Polygon-datum searches reject a polygon from a mission the user is not in."""
        poly = self._other_geo(Polygon(((172.5, -43.5), (172.6, -43.5), (172.6, -43.6), (172.5, -43.5))), 'polygon')
        response = self.smm.client1.post('/search/creepingline/create/polygon/', data={
            'poly_id': poly.pk, 'asset_type_id': self.asset_type.pk, 'sweep_width': 200,
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Search.objects.count(), 0)


class SearchClosedMissionTestCase(TestCase):
    """
    Search create/preview/queue/begin/finished must be blocked on a closed mission.
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        assets = AssetsHelpers(self.smm)
        searches = SearchHelpers(self.smm)
        missions = MissionFunctions(self.smm)
        self.asset_type = assets.create_asset_type()
        self.asset = assets.create_asset(asset_type=self.asset_type)
        mission = missions.create_mission('closed search mission')
        mission.add_asset(self.asset)
        self.poi = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), created_by=self.smm.user1, label='datum', geo_type='poi', mission=mission.get_object())
        # Create a search while the mission is open, then close the mission.
        self.search = searches.create_sector(self.poi, 200, self.asset_type)
        mission_obj = mission.get_object()
        mission_obj.closed = timezone.now()
        mission_obj.closed_by = self.smm.user1
        mission_obj.save()

    def test_create_rejected_on_closed_mission(self):
        """Saving a new search against a closed mission's datum is forbidden."""
        response = self.smm.client1.post('/search/sector/create/', data={
            'poi_id': self.poi.pk, 'asset_type_id': self.asset_type.pk, 'sweep_width': 200,
        })
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Search.objects.count(), 1)  # only the one created during setUp

    def test_preview_rejected_on_closed_mission(self):
        """Previewing a search against a closed mission's datum is forbidden."""
        response = self.smm.client1.get('/search/sector/create/', data={
            'poi_id': self.poi.pk, 'asset_type_id': self.asset_type.pk, 'sweep_width': 200,
        })
        self.assertEqual(response.status_code, 403)

    def test_queue_rejected_on_closed_mission(self):
        """Queueing a search in a closed mission is forbidden."""
        response = self.smm.client1.post(f'/search/{self.search.search_id}/queue/', data={})
        self.assertEqual(response.status_code, 403)
        self.assertIsNone(self.search.as_object().queued_at)

    def test_unqueue_rejected_on_closed_mission(self):
        """Unqueueing a search in a closed mission is forbidden."""
        Search.objects.filter(pk=self.search.search_id).update(queued_at=timezone.now())
        response = self.smm.client1.delete(f'/search/{self.search.search_id}/queue/')
        self.assertEqual(response.status_code, 403)
        self.assertIsNotNone(self.search.as_object().queued_at)

    def test_begin_rejected_on_closed_mission(self):
        """Beginning a search in a closed mission is forbidden."""
        response = self.smm.client1.post(f'/search/{self.search.search_id}/begin/', data={'asset_id': self.asset.pk})
        self.assertEqual(response.status_code, 403)
        self.assertIsNone(self.search.as_object().inprogress_by)

    def test_finished_rejected_on_closed_mission(self):
        """Finishing a search in a closed mission is forbidden."""
        response = self.smm.client1.post(f'/search/{self.search.search_id}/finished/', data={'asset_id': self.asset.pk})
        self.assertEqual(response.status_code, 403)
        self.assertIsNone(self.search.as_object().completed_at)
