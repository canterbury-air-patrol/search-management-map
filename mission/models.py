"""
Models for missions (and mission membership)
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

from assets.models import Asset, AssetType


class Mission(models.Model):
    """
    A mission. Missions are used to group users and data related to a specific event, and isolate them from other groups/data.
    """
    mission_name = models.CharField(default='', max_length=200)
    mission_description = models.TextField(null=True, blank=True)
    started = models.DateTimeField(default=timezone.now)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    closed = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='closer%(app_label)s_%(class)s_related', null=True, blank=True)

    def jsonObject(self, admin):
        return {
            'id': self.pk,
            'name': self.mission_name,
            'description': self.mission_description,
            'started': self.started,
            'creator': self.creator.username,
            'closed': self.closed,
            'closed_by': self.closed_by.username if self.closed_by else None,
            'admin': admin,
        }


class MissionUser(models.Model):
    """
    A user/mission association.

    This is how users are able to see/view/participate in a mission.
    """
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT)
    user = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)

    USER_ROLE = (
        ('M', 'Member'),
        ('A', 'Admin'),
    )
    role = models.CharField(max_length=1, choices=USER_ROLE, default='M')

    def user_role_name(self):
        """
        Return a human-readable name for this users' role.
        """
        for row in self.USER_ROLE:
            if row[0] == self.role:
                return row[1]
        return "Unknown"

    def is_admin(self):
        """
        Return true if this user is an admin
        """
        return self.role == 'A'


class MissionAsset(models.Model):
    """
    An asset/mission association.

    This is how assets are shown as part of a mission.
    """
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)
    remover = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='remover%(app_label)s_%(class)s_related', null=True, blank=True)
    removed = models.DateTimeField(null=True, blank=True)


class MissionAssetType(models.Model):
    """
    An asset/mission association.

    This is how assets are shown as part of a mission.
    """
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT)
    asset_type = models.ForeignKey(AssetType, on_delete=models.PROTECT)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)
    remover = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='remover%(app_label)s_%(class)s_related', null=True, blank=True)
    removed = models.DateTimeField(null=True, blank=True)
