"""
Tests for marinesar functionality
"""

from django.test import TestCase
from django.contrib.gis.geos import Point

from data.models import GeoTimeLabel
from mission.models import Mission, MissionUser
from smm.tests import SMMTestUsers

from .models import MarineTotalDriftVector


class MarineVectorCreateTestCase(TestCase):
    """
    Tests for creating marine total drift vectors
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        # A mission the user is a member of, and a separate mission they are not
        self.mission = Mission.objects.create(creator=self.smm.user1, mission_name='marine mission')
        MissionUser(mission=self.mission, user=self.smm.user1, permissions_admin=True, creator=self.smm.user1).save()
        self.other_mission = Mission.objects.create(creator=self.smm.user2, mission_name='other mission')
        MissionUser(mission=self.other_mission, user=self.smm.user2, permissions_admin=True, creator=self.smm.user2).save()
        self.poi = self._make_poi(self.mission, self.smm.user1, 'datum')
        self.other_poi = self._make_poi(self.other_mission, self.smm.user2, 'other datum')

    @staticmethod
    def _make_poi(mission, user, label):
        return GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), created_by=user, label=label, geo_type='poi', mission=mission)

    def _payload(self, poi):
        return {
            'poi_id': poi.pk,
            'from_lat': -43.5, 'from_lng': 172.5,
            'leeway_multiplier': 1.0, 'leeway_modifier': 0.0,
            'curr_total': 1, 'wind_total': 0,
            'curr_0_from': '12:00', 'curr_0_to': '13:00',
            'curr_0_direction': 90, 'curr_0_distance': 1.0, 'curr_0_speed': 1.0,
        }

    def _url(self):
        return f'/mission/{self.mission.pk}/sar/marine/vectors/create/'

    def test_create_with_same_mission_datum(self):
        """A datum from the current mission is accepted and the vector is saved."""
        response = self.smm.client1.post(self._url(), self._payload(self.poi))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(MarineTotalDriftVector.objects.filter(mission=self.mission).count(), 1)

    def test_create_rejects_cross_mission_datum(self):
        """A datum from another mission is rejected and no vector is saved."""
        response = self.smm.client1.post(self._url(), self._payload(self.other_poi))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(MarineTotalDriftVector.objects.count(), 0)

    def test_preview_rejects_cross_mission_datum(self):
        """The GET preview path also rejects a cross-mission datum."""
        response = self.smm.client1.get(self._url(), self._payload(self.other_poi))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(MarineTotalDriftVector.objects.count(), 0)
