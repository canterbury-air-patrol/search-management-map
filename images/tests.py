"""
Tests for images
"""

from django.test import TestCase
from django.utils import timezone
from django.contrib.gis.geos import Point

from mission.models import Mission, MissionUser
from smm.tests import SMMTestUsers

from .models import GeoImage


class ImageClosedMissionTestCase(TestCase):
    """
    Image upload and priority changes must be blocked on a closed mission.
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        self.mission = Mission.objects.create(creator=self.smm.user1, mission_name='closed', closed=timezone.now(), closed_by=self.smm.user1)
        MissionUser(mission=self.mission, user=self.smm.user1, permissions_admin=True, creator=self.smm.user1).save()

    def test_upload_rejected_on_closed_mission(self):
        """Uploading an image to a closed mission is forbidden."""
        response = self.smm.client1.post(f'/mission/{self.mission.pk}/image/upload/', {
            'latitude': -43.5, 'longitude': 172.5, 'description': 'nope',
        })
        self.assertEqual(response.status_code, 403)
        self.assertEqual(GeoImage.objects.count(), 0)

    def test_priority_change_rejected_on_closed_mission(self):
        """Changing image priority in a closed mission is forbidden and does not mutate it."""
        image = GeoImage.objects.create(geo=Point(172.5, -43.5), description='img', original_format='jpeg', created_by=self.smm.user1, mission=self.mission)
        response = self.smm.client1.patch(f'/image/{image.pk}/priority/', data='{"priority": true}', content_type='application/json')
        self.assertEqual(response.status_code, 403)
        image.refresh_from_db()
        self.assertFalse(image.priority)
