"""
Tests for data handling
"""

from datetime import timedelta

from django.contrib.gis.geos import Point
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from mission.models import Mission, MissionUser
from .models import GeoTimeLabel


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
