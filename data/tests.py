"""
Tests for data handling

TODO
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from mission.models import Mission, MissionUser


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
