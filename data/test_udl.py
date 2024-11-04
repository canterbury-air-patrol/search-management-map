"""
Tests for the User Drawn Lines (user created line/time/label)
"""

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
