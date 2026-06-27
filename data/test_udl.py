"""
Tests for the User Drawn Lines (user created line/time/label)
"""

from django.test import Client
from django.contrib.gis.geos import LineString

from .models import GeoTimeLabel
from .tests import UserDataTestCase


class UserDrawnLineTestCase(UserDataTestCase):
    """
    Test User Drawn Lines
    """
    def test_line_create(self):
        """
        Create a UDL
        """
        line = GeoTimeLabel.objects.create(geo=LineString((172.5, -43.5), (172.6, -43.6)), created_by=self.user, label='Test Line', geo_type='line', mission=self.mission)
        self.assertEqual(str(line).startswith("Test Line"), True)
        self.assertEqual(len(line.geo), 2)
        self.assertEqual(line.geo[0][0], 172.5)
        self.assertEqual(line.geo[0][1], -43.5)

    def test_line_create_100(self):
        """
        Create a UDL with only 1 point
        """
        points = [(172.0 + i * 0.1, -42 - i * 0.1) for i in range(100)]
        line = GeoTimeLabel.objects.create(geo=LineString(points), created_by=self.user, label='Test Line', geo_type='line', mission=self.mission)
        self.assertEqual(str(line).startswith("Test Line"), True)
        self.assertEqual(len(line.geo), 100)
        for i in range(1, 100):
            self.assertEqual(line.geo[i][0], 172.0 + i * 0.1)
            self.assertEqual(line.geo[i][1], -42 - i * 0.1)

    def test_line_api_create_via_post(self):
        """
        Creating a line via POST works.
        """
        client = Client()
        client.login(username='test', password='password')
        url = f'/mission/{self.mission.pk}/data/userlines/create/'
        response = client.post(url, {
            'label': 'POST Line', 'points': 2,
            'point0_lat': -43.5, 'point0_lng': 172.5,
            'point1_lat': -43.6, 'point1_lng': 172.6,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(GeoTimeLabel.objects.filter(label='POST Line', geo_type='line').count(), 1)

    def test_line_api_create_rejects_get(self):
        """
        Creating a line mutates state, so GET must be rejected (CSRF safe method).
        """
        client = Client()
        client.login(username='test', password='password')
        url = f'/mission/{self.mission.pk}/data/userlines/create/'
        response = client.get(url, {
            'label': 'GET Line', 'points': 2,
            'point0_lat': -43.5, 'point0_lng': 172.5,
            'point1_lat': -43.6, 'point1_lng': 172.6,
        })
        self.assertEqual(response.status_code, 405)
        self.assertEqual(GeoTimeLabel.objects.filter(label='GET Line').count(), 0)


class UserDrawnPolygonTestCase(UserDataTestCase):
    """
    Test the user polygon create API
    """
    def test_polygon_api_create_via_post(self):
        """
        Creating a polygon via POST works.
        """
        client = Client()
        client.login(username='test', password='password')
        url = f'/mission/{self.mission.pk}/data/userpolygons/create/'
        response = client.post(url, {
            'label': 'POST Polygon', 'points': 3,
            'point0_lat': -43.5, 'point0_lng': 172.5,
            'point1_lat': -43.6, 'point1_lng': 172.6,
            'point2_lat': -43.5, 'point2_lng': 172.6,
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(GeoTimeLabel.objects.filter(label='POST Polygon', geo_type='polygon').count(), 1)

    def test_polygon_api_create_rejects_get(self):
        """
        Creating a polygon mutates state, so GET must be rejected.
        """
        client = Client()
        client.login(username='test', password='password')
        url = f'/mission/{self.mission.pk}/data/userpolygons/create/'
        response = client.get(url, {
            'label': 'GET Polygon', 'points': 3,
            'point0_lat': -43.5, 'point0_lng': 172.5,
            'point1_lat': -43.6, 'point1_lng': 172.6,
            'point2_lat': -43.5, 'point2_lng': 172.6,
        })
        self.assertEqual(response.status_code, 405)
        self.assertEqual(GeoTimeLabel.objects.filter(label='GET Polygon').count(), 0)
