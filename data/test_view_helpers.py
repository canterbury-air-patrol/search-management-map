from django.contrib.gis.geos import Point
from django.test import TestCase, RequestFactory
from django.http import HttpResponse

from mission.models import Mission
from smm.tests import SMMTestUsers

from .view_helpers import to_geojson, to_kml, geotimelabel_replace, point_label_make
from .models import GeoTimeLabel


class ViewHelpersTestCase(TestCase):
    def setUp(self):
        self.smm = SMMTestUsers()
        self.factory = RequestFactory()
        # create a mission for objects
        self.mission = Mission.objects.create(mission_name='m', creator=self.smm.user1)

    def test_to_geojson_and_kml(self):
        # create a simple GeoTimeLabel
        ptl = GeoTimeLabel.objects.create(geo=Point(174.0, -41.0), label='here', created_by=self.smm.user1, mission=self.mission, geo_type='poi')

        # geojson
        resp = to_geojson(GeoTimeLabel, [ptl])
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/geo+json')
        self.assertIn('here', resp.content.decode('utf-8'))

        # kml
        resp2 = to_kml(GeoTimeLabel, [ptl])
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2['Content-Type'], 'application/vnd.google-earth.kml+xml')
        self.assertIn('<kml', resp2.content.decode('utf-8'))

    def test_geotimelabel_replace_checks(self):
        # make an object and mark deleted
        ptl = GeoTimeLabel.objects.create(geo=Point(174.0, -41.0), label='x', created_by=self.smm.user1, mission=self.mission, geo_type='poi')
        ptl.deleted_at = ptl.created_at
        ptl.deleted_by = self.smm.user1
        ptl.save()

        resp = geotimelabel_replace(None, 'POI', ptl, self.mission, lambda r, mission=None, replaces=None: None)
        self.assertEqual(resp.status_code, 404)

        # now mark replaced
        ptl2 = GeoTimeLabel.objects.create(geo=Point(174.1, -41.1), label='y', created_by=self.smm.user1, mission=self.mission, geo_type='poi')
        ptl2.replaced_by = ptl
        ptl2.save()
        resp2 = geotimelabel_replace(None, 'POI', ptl2, self.mission, lambda r, mission=None, replaces=None: None)
        self.assertEqual(resp2.status_code, 404)

    def test_point_label_make_missing_and_create(self):
        # missing params should return bad request
        req = self.factory.get('/')
        req.user = self.smm.user1
        resp = point_label_make(req, mission=self.mission)
        self.assertEqual(resp.status_code, 400)

        # valid post should create and return geojson
        req2 = self.factory.post('/', data={'lat': '-41.0', 'lon': '174.0', 'label': 'created'})
        req2.user = self.smm.user1
        resp2 = point_label_make(req2, mission=self.mission)
        self.assertEqual(resp2.status_code, 200)
        self.assertIn('created', resp2.content.decode('utf-8'))

    def test_user_polygon_and_line_make(self):
        # polygon should reject non-POST
        req = self.factory.get('/')
        req.user = self.smm.user1
        from .view_helpers import user_polygon_make, user_line_make
        resp = user_polygon_make(req, mission=self.mission)
        self.assertEqual(resp.status_code, 400)

        # valid polygon create
        data = {
            'label': 'poly',
            'points': '3',
            'point0_lat': '-41.0', 'point0_lng': '174.0',
            'point1_lat': '-41.1', 'point1_lng': '174.1',
            'point2_lat': '-41.2', 'point2_lng': '174.2',
        }
        req2 = self.factory.post('/', data=data)
        req2.user = self.smm.user1
        resp2 = user_polygon_make(req2, mission=self.mission)
        self.assertEqual(resp2.status_code, 200)
        self.assertIn('poly', resp2.content.decode('utf-8'))

        # replace failure should delete and return bad request
        class Dummy:
            def replace(self, obj):
                return False

        req3 = self.factory.post('/', data=data)
        req3.user = self.smm.user1
        resp3 = user_polygon_make(req3, mission=self.mission, replaces=Dummy())
        self.assertEqual(resp3.status_code, 400)

        # line should reject non-POST
        resp_line = user_line_make(self.factory.get('/'), mission=self.mission)
        self.assertEqual(resp_line.status_code, 400)

        # valid line create
        data_line = {
            'label': 'line',
            'points': '2',
            'point0_lat': '-41.0', 'point0_lng': '174.0',
            'point1_lat': '-41.1', 'point1_lng': '174.1',
        }
        reql = self.factory.post('/', data=data_line)
        reql.user = self.smm.user1
        resp_l = user_line_make(reql, mission=self.mission)
        self.assertEqual(resp_l.status_code, 200)
        self.assertIn('line', resp_l.content.decode('utf-8'))

        # replace failure for line
        reql2 = self.factory.post('/', data=data_line)
        reql2.user = self.smm.user1
        resp_l2 = user_line_make(reql2, mission=self.mission, replaces=Dummy())
        self.assertEqual(resp_l2.status_code, 400)

    def test_geotimelabel_replace_success(self):
        # calling geotimelabel_replace when not deleted or replaced should call func
        ptl = GeoTimeLabel.objects.create(geo=Point(174.2, -41.2), label='ok', created_by=self.smm.user1, mission=self.mission, geo_type='poi')

        def myfunc(r, mission=None, replaces=None):
            return HttpResponse('ok')
        req = self.factory.get('/')
        req.user = self.smm.user1
        resp = geotimelabel_replace(req, 'POI', ptl, self.mission, myfunc)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('ok', resp.content.decode('utf-8'))

    def test_point_label_make_replace_failure(self):
        # replace failure should delete created point and return 400
        class DummyReplace:
            def replace(self, obj):
                return False
        req = self.factory.post('/', data={'lat': '-41.3', 'lon': '174.3', 'label': 'pt'})
        req.user = self.smm.user1
        resp = point_label_make(req, mission=self.mission, replaces=DummyReplace())
        self.assertEqual(resp.status_code, 400)
