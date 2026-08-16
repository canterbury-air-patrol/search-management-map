"""
Tests for abandoning a search

Abandoning releases an in-progress search back to the pool so another
asset can pick it up, without offering it straight back to the asset
that gave it up.
"""

from django.test import TestCase
from django.utils import timezone
from django.contrib.gis.geos import Point

from data.models import GeoTimeLabel

from smm.tests import SMMTestUsers

from assets.tests import AssetsHelpers
from mission.tests import MissionFunctions
from timeline.models import TimeLineEntry

from .models import Search
from .tests import SearchHelpers


class SearchAbandonModelTestCase(TestCase):
    """
    Tests for Search.abandon()
    """
    def setUp(self):
        self.smm = SMMTestUsers()
        assets = AssetsHelpers(self.smm)
        self.searches = SearchHelpers(self.smm)
        self.asset_type = assets.create_asset_type()
        self.asset = assets.create_asset(name='asset_a', asset_type=self.asset_type)
        self.other_asset = assets.create_asset(name='asset_b', asset_type=self.asset_type)
        self.mission = MissionFunctions(self.smm).create_mission('abandon mission')
        self.mission.add_asset(self.asset)
        self.mission.add_asset(self.other_asset)
        self.poi = GeoTimeLabel.objects.create(geo=Point(172.5, -43.5), created_by=self.smm.user1, label='datum', geo_type='poi', mission=self.mission.get_object())

    def create_inprogress_search(self, asset=None):
        """
        Create a search and put it in progress by an asset
        """
        if asset is None:
            asset = self.asset
        search = self.searches.create_sector(self.poi, 200, self.asset_type).as_object()
        self.assertTrue(search.set_inprogress_by(asset, self.smm.user1))
        return search

    def test_abandon_clears_inprogress_and_queue(self):
        """
        Abandoning releases the asset and takes the search out of the queue
        """
        search = self.create_inprogress_search()
        Search.objects.filter(pk=search.pk).update(queued_at=timezone.now(), queued_for_asset=self.asset)
        search.refresh_from_db()

        self.assertTrue(search.abandon(self.asset, self.smm.user1))

        search.refresh_from_db()
        self.assertIsNone(search.inprogress_at)
        self.assertIsNone(search.inprogress_by)
        self.assertIsNone(search.queued_at)
        self.assertIsNone(search.queued_for_asset)

    def test_abandon_returns_search_to_all_waiting(self):
        """
        An abandoned search is available to be picked up again
        """
        search = self.create_inprogress_search()
        mission = self.mission.get_object()
        self.assertNotIn(search, Search.all_waiting(mission))

        search.abandon(self.asset, self.smm.user1)

        self.assertIn(search, Search.all_waiting(mission))

    def test_abandon_records_the_asset(self):
        """
        The abandoning asset is recorded so it can be excluded later
        """
        search = self.create_inprogress_search()

        search.abandon(self.asset, self.smm.user1)

        self.assertEqual(list(search.abandoned_by.all()), [self.asset])

    def test_abandon_records_timeline_entry(self):
        """
        Abandoning a search is visible in the mission timeline
        """
        search = self.create_inprogress_search()

        search.abandon(self.asset, self.smm.user1)

        entries = TimeLineEntry.objects.filter(mission=self.mission.get_object(), event_type='sab')
        self.assertEqual(entries.count(), 1)
        self.assertIn(str(self.asset), entries[0].message)

    def test_abandon_rejects_other_asset(self):
        """
        An asset cannot abandon a search another asset is conducting
        """
        search = self.create_inprogress_search()

        self.assertFalse(search.abandon(self.other_asset, self.smm.user1))

        search.refresh_from_db()
        self.assertEqual(search.inprogress_by, self.asset)
        self.assertEqual(TimeLineEntry.objects.filter(event_type='sab').count(), 0)

    def test_abandon_rejects_not_inprogress_search(self):
        """
        A search nobody is conducting cannot be abandoned
        """
        search = self.searches.create_sector(self.poi, 200, self.asset_type).as_object()

        self.assertFalse(search.abandon(self.asset, self.smm.user1))

    def test_abandon_rejects_completed_search(self):
        """
        A completed search cannot be abandoned
        """
        search = self.create_inprogress_search()
        search.completed_at = timezone.now()
        search.completed_by = self.asset
        search.save()

        self.assertFalse(search.abandon(self.asset, self.smm.user1))

        search.refresh_from_db()
        self.assertEqual(search.inprogress_by, self.asset)

    def test_abandon_rejects_deleted_search(self):
        """
        A deleted search cannot be abandoned
        """
        search = self.create_inprogress_search()
        Search.objects.filter(pk=search.pk).update(deleted_at=timezone.now(), deleted_by=self.smm.user1)
        search.refresh_from_db()

        self.assertFalse(search.abandon(self.asset, self.smm.user1))

        search.refresh_from_db()
        self.assertEqual(search.inprogress_by, self.asset)

    def test_abandoning_asset_is_not_offered_the_search_again(self):
        """
        find_next_search must not hand the search straight back
        """
        search = self.create_inprogress_search()
        search.abandon(self.asset, self.smm.user1)

        response = self.searches.find_closest(-43.5, 172.5, self.asset)

        self.assertEqual(response.status_code, 404)

    def test_other_asset_is_offered_the_abandoned_search(self):
        """
        The point of abandoning is to reassign, so everyone else still sees it
        """
        search = self.create_inprogress_search()
        search.abandon(self.asset, self.smm.user1)

        response = self.searches.find_closest(-43.5, 172.5, self.other_asset)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['object_url'], f'/search/{search.pk}/')

    def test_abandoning_asset_is_offered_a_different_search(self):
        """
        Excluding one abandoned search doesn't stop the asset working
        """
        abandoned = self.create_inprogress_search()
        abandoned.abandon(self.asset, self.smm.user1)
        spare = self.searches.create_sector(self.poi, 200, self.asset_type).as_object()

        response = self.searches.find_closest(-43.5, 172.5, self.asset)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['object_url'], f'/search/{spare.pk}/')

    def test_abandoning_asset_skipped_for_asset_type_queue(self):
        """
        Re-queueing an abandoned search for its type doesn't reach the abandoner
        """
        search = self.create_inprogress_search()
        search.abandon(self.asset, self.smm.user1)
        Search.objects.filter(pk=search.pk).update(queued_at=timezone.now())

        self.assertIsNone(Search.oldest_queued_for_asset_type(self.mission.get_object(), self.asset_type, exclude_asset=self.asset))
        self.assertEqual(Search.oldest_queued_for_asset_type(self.mission.get_object(), self.asset_type, exclude_asset=self.other_asset), search)

    def test_explicit_asset_queue_overrides_abandonment(self):
        """
        Queueing the search for the abandoning asset by name reassigns it back
        """
        search = self.create_inprogress_search()
        search.abandon(self.asset, self.smm.user1)
        Search.objects.filter(pk=search.pk).update(queued_at=timezone.now(), queued_for_asset=self.asset)

        response = self.searches.find_closest(-43.5, 172.5, self.asset)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['object_url'], f'/search/{search.pk}/')
