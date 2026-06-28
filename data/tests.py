"""
Tests for data handling
"""

from datetime import timedelta

from django.contrib.gis.geos import Point, LineString
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from mission.models import Mission, MissionUser
from .models import GeoTimeLabel, UserPointTime


class UserDataTestCase(TestCase):
    """
    Generic Tests for User Data
    """
    def setUp(self):
        """
        Create the required objects
        """
        self.user = get_user_model().objects.create_user('test', password='password')
        self.user_non_member = get_user_model().objects.create_user('test2', password='password')
        self.mission = Mission.objects.create(creator=self.user)
        MissionUser(mission=self.mission, user=self.user, permissions_admin=True, creator=self.user).save()


class UserRecordPositionTestCase(TestCase):
    """
    Tests for recording a user's own position
    """
    def setUp(self):
        self.user = get_user_model().objects.create_user('test', password='password')
        self.mission = Mission.objects.create(creator=self.user)
        MissionUser(mission=self.mission, user=self.user, permissions_admin=True, creator=self.user).save()
        self.url = f'/mission/{self.mission.pk}/data/user/{self.user.username}/position/add/'
        self.client.force_login(self.user)

    def test_user_record_position_via_post(self):
        """
        Recording a user position via POST works.
        """
        response = self.client.post(self.url, {'lat': -43.5, 'lon': 172.5})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(UserPointTime.objects.filter(user=self.user).count(), 1)

    def test_user_record_position_rejects_get(self):
        """
        Recording a user position mutates state, so GET must be rejected.
        """
        response = self.client.get(self.url, {'lat': -43.5, 'lon': 172.5})
        self.assertEqual(response.status_code, 405)
        self.assertEqual(UserPointTime.objects.filter(user=self.user).count(), 0)


class ClosedMissionWriteProtectionTestCase(TestCase):
    """
    Closed missions are read-only: data write endpoints must reject mutations.
    """
    def setUp(self):
        self.user = get_user_model().objects.create_user('test', password='password')
        self.mission = Mission.objects.create(creator=self.user, closed=timezone.now(), closed_by=self.user)
        MissionUser(mission=self.mission, user=self.user, permissions_admin=True, creator=self.user).save()
        self.client.force_login(self.user)

    def test_poi_create_rejected_on_closed_mission(self):
        """Creating a POI in a closed mission is forbidden."""
        response = self.client.post(f'/mission/{self.mission.pk}/data/pois/create/', {'lat': -43.5, 'lon': 172.5, 'label': 'nope'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(GeoTimeLabel.objects.filter(mission=self.mission).count(), 0)

    def test_line_create_rejected_on_closed_mission(self):
        """Creating a line in a closed mission is forbidden."""
        response = self.client.post(f'/mission/{self.mission.pk}/data/userlines/create/', {
            'label': 'nope', 'points': 2,
            'point0_lat': -43.5, 'point0_lng': 172.5, 'point1_lat': -43.6, 'point1_lng': 172.6,
        })
        self.assertEqual(response.status_code, 403)
        self.assertEqual(GeoTimeLabel.objects.filter(mission=self.mission).count(), 0)

    def test_user_record_position_rejected_on_closed_mission(self):
        """Recording a user position in a closed mission is forbidden."""
        response = self.client.post(f'/mission/{self.mission.pk}/data/user/{self.user.username}/position/add/', {'lat': -43.5, 'lon': 172.5})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(UserPointTime.objects.filter(mission=self.mission).count(), 0)

    def test_poi_replace_rejected_on_closed_mission(self):
        """Replacing an existing POI in a closed mission is forbidden and does not mutate it."""
        poi = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), created_by=self.user, label='original', geo_type='poi', mission=self.mission)
        response = self.client.post(f'/data/pois/{poi.pk}/replace/', {'lat': -43.6, 'lon': 172.6, 'label': 'changed'})
        self.assertEqual(response.status_code, 403)
        poi.refresh_from_db()
        self.assertEqual(poi.label, 'original')
        self.assertIsNone(poi.replaced_by)

    def test_line_replace_rejected_on_closed_mission(self):
        """Replacing an existing line in a closed mission is forbidden and does not mutate it."""
        line = GeoTimeLabel.objects.create(geo=LineString((172.5, -43.5), (172.6, -43.6)), created_by=self.user, label='original line', geo_type='line', mission=self.mission)
        response = self.client.post(f'/data/userlines/{line.pk}/replace/', {
            'label': 'changed line', 'points': 2,
            'point0_lat': -43.5, 'point0_lng': 172.5, 'point1_lat': -43.6, 'point1_lng': 172.6,
        })
        self.assertEqual(response.status_code, 403)
        line.refresh_from_db()
        self.assertEqual(line.label, 'original line')
        self.assertIsNone(line.replaced_by)

    def test_read_still_allowed_on_closed_mission(self):
        """Reading mission data is still allowed after closure."""
        response = self.client.get(f'/mission/{self.mission.pk}/data/pois/current/')
        self.assertEqual(response.status_code, 200)


class GeoTimeAllCurrentTestCase(TestCase):
    """
    Tests for GeoTime.all_current with a current_at time parameter.
    Uses GeoTimeLabel as the concrete subclass.
    """
    def setUp(self):
        self.user = get_user_model().objects.create_user('test', password='password')
        self.mission = Mission.objects.create(creator=self.user)
        MissionUser(mission=self.mission, user=self.user, permissions_admin=True, creator=self.user).save()
        self.point = Point(0, 0)

    def _make_label(self, created_at):
        return GeoTimeLabel.objects.create(
            geo=self.point,
            created_by=self.user,
            label='test',
            geo_type='poi',
            mission=self.mission,
            created_at=created_at,
        )

    def test_all_current_includes_object_created_before_current_at(self):
        """Objects created before current_at are included."""
        now = timezone.now()
        past = now - timedelta(hours=1)
        self._make_label(created_at=past)
        result = GeoTimeLabel.all_current(self.mission, current_at=now)
        self.assertEqual(result.count(), 1)

    def test_all_current_excludes_object_created_after_current_at(self):
        """Objects created after current_at are excluded."""
        now = timezone.now()
        future = now + timedelta(hours=1)
        self._make_label(created_at=future)
        result = GeoTimeLabel.all_current(self.mission, current_at=now)
        self.assertEqual(result.count(), 0)

    def test_all_current_includes_object_created_exactly_at_current_at(self):
        """Objects created exactly at current_at are included (lte boundary)."""
        now = timezone.now()
        self._make_label(created_at=now)
        result = GeoTimeLabel.all_current(self.mission, current_at=now)
        self.assertEqual(result.count(), 1)

    def test_all_current_excludes_deleted_before_current_at(self):
        """Objects deleted before current_at are excluded."""
        now = timezone.now()
        past = now - timedelta(hours=2)
        deleted_at = now - timedelta(hours=1)
        label = self._make_label(created_at=past)
        GeoTimeLabel.objects.filter(pk=label.pk).update(deleted_at=deleted_at, deleted_by=self.user)
        result = GeoTimeLabel.all_current(self.mission, current_at=now)
        self.assertEqual(result.count(), 0)

    def test_all_current_includes_object_deleted_after_current_at(self):
        """Objects deleted after current_at are still visible at that time."""
        now = timezone.now()
        past = now - timedelta(hours=2)
        future_delete = now + timedelta(hours=1)
        label = self._make_label(created_at=past)
        GeoTimeLabel.objects.filter(pk=label.pk).update(deleted_at=future_delete, deleted_by=self.user)
        result = GeoTimeLabel.all_current(self.mission, current_at=now)
        self.assertEqual(result.count(), 1)

    def test_all_current_no_current_at_returns_non_deleted(self):
        """With no current_at, only non-deleted objects are returned."""
        now = timezone.now()
        past = now - timedelta(hours=1)
        active = self._make_label(created_at=past)
        deleted = self._make_label(created_at=past)
        GeoTimeLabel.objects.filter(pk=deleted.pk).update(deleted_at=past, deleted_by=self.user)
        result = GeoTimeLabel.all_current(self.mission)
        pks = list(result.values_list('pk', flat=True))
        self.assertIn(active.pk, pks)
        self.assertNotIn(deleted.pk, pks)
