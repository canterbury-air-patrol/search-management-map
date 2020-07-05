"""
Tests for the User Drawn Lines (user created line/time/label)
"""

import json

from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point, LineString

from mission.models import Mission, MissionUser
from .models import GeoTimeLabel


class UserDrawnLineTestCase(TestCase):
    """
    Test User Drawn Lines
    """
    def setUp(self):
        """
        Create the required objects
        """
        self.user = User.objects.create_user('test', password='password')
        self.user_non_member = User.objects.create_user('test2', password='password')
        self.mission = Mission.objects.create(creator=self.user)
        MissionUser(mission=self.mission, user=self.user, role='A', creator=self.user).save()

    def test_line_create(self):
        """
        Create a UDL
        """
        line = GeoTimeLabel.objects.create(geo=LineString((172.5, -43.5), (172.6, -43.6)), created_by=self.user, label='Test Line', geo_type='line', mission=self.mission)
        self.assertEqual(str(line), "Test Line")
        self.assertEqual(len(line.geo), 2)
        self.assertEqual(line.geo[0][0], 172.5)
        self.assertEqual(line.geo[0][1], -43.5)

    def test_line_create_100(self):
        """
        Create a UDL with only 1 point
        """
        points = []
        for i in range(0, 100):
            points.append((172.0 + i * 0.1, -42 - i * 0.1))
        line = GeoTimeLabel.objects.create(geo=LineString(points), created_by=self.user, label='Test Line', geo_type='line', mission=self.mission)
        self.assertEqual(str(line), "Test Line")
        self.assertEqual(len(line.geo), 100)
        for i in range(1, 100):
            self.assertEqual(line.geo[i][0], 172.0 + i * 0.1)
            self.assertEqual(line.geo[i][1], -42 - i * 0.1)

