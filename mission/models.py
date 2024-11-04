"""
Models for missions (and mission membership)
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

from assets.models import Asset, AssetType
from organization.models import Organization, OrganizationMember


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

    def as_object(self, admin):
        """
        Convert mission to an object that is suitable for returning via JsonResponse
        """
        return {
            'id': self.pk,
            'name': self.mission_name,
            'description': self.mission_description,
            'started': self.started,
            'creator': self.creator.username,  # pylint: disable=E1101
            'closed': self.closed,
            'closed_by': self.closed_by.username if self.closed_by else None,  # pylint: disable=E1101
            'admin': admin,
        }

    @classmethod
    def all_user_missions(cls, user):
        """
        Get all missions the given user is a member of (either directly or via an organization)
        """
        missions = list(MissionUser.user_missions(user))
        missions += list(MissionOrganization.mission_user(user))
        return missions


class MissionUser(models.Model):
    """
    A user/mission association.

    This is how users are able to see/view/participate in a mission.
    """
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT)
    user = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)

    permissions_admin = models.BooleanField(default=False)
    permissions_organization_add = models.BooleanField(default=False)
    permissions_user_add = models.BooleanField(default=False)

    def user_role_name(self):
        """
        Return a human-readable name for this users' role.
        """
        return "Admin" if self.permissions_admin else "Member"

    def is_admin(self):
        """
        Return true if this user is an admin
        """
        return self.permissions_admin

    def can_add_organization(self):
        """
        Return true if this user can add organizations to this mission
        """
        return self.permissions_admin or self.permissions_organization_add

    def can_add_user(self):
        """
        Return true if this user can add users to this mission
        """
        return self.permissions_admin or self.permissions_user_add

    def as_json(self):
        """
        return this mission user as a json object
        """
        return {
            'mission': self.mission.pk,
            'user': str(self.user),
            'creator': str(self.creator),
            'added': self.added,
            'permissions': {
                'admin': self.is_admin(),
                'add_organization': self.can_add_organization(),
                'add_user': self.can_add_user(),
            }
        }

    @classmethod
    def user_missions(cls, user):
        """
        Get all missions this user is in
        """
        return Mission.objects.filter(missionuser__user=user)


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


class MissionAssetStatusValue(models.Model):
    """
    A possible status for an asset in a mission

    This provides a common set of statuses for asset owners to use to
    report the status of assets to other users.
    """
    name = models.CharField(max_length=30, unique=True)
    description = models.TextField(null=True, blank=True)

    def as_object(self):
        """
        Convert this mission asset status value to an object that is suitable for returning via JsonResponse
        """
        return {
            'id': self.pk,
            'name': self.name,
            'description': self.description
        }

    def __str__(self):
        return self.name


class MissionAssetStatus(models.Model):
    """
    The status of an asset in the mission at a specific time
    """
    mission_asset = models.ForeignKey(MissionAsset, on_delete=models.PROTECT)
    status = models.ForeignKey(MissionAssetStatusValue, on_delete=models.PROTECT)
    since = models.DateTimeField(default=timezone.now)
    notes = models.TextField(null=True, blank=True)

    def as_object(self):
        """
        Convert this mission asset status to an object that is suitable for returning via JsonResponse
        """
        return {
            'id': self.pk,
            'asset': self.mission_asset.asset.name,
            'asset_id': self.mission_asset.asset.pk,
            'status': self.status.name,
            'status_description': self.status.description,
            'since': self.since,
            'notes': self.notes
        }

    def __str__(self):
        return f'{self.mission_asset.asset.name} is {self.status.name}'

    @classmethod
    def current_for_asset(cls, mission_asset):
        """
        Get the most recent status for a mission asset
        """
        try:
            return cls.objects.filter(mission_asset=mission_asset).latest('since')
        except cls.DoesNotExist:
            return None

    class Meta:
        indexes = [
            models.Index(fields=['mission_asset']),
            models.Index(fields=['since']),
        ]


class MissionOrganization(models.Model):
    """
    An organization/mission association.

    This is how organizations (groups of users+assets) are added to missions.
    """
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT)
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    added = models.DateTimeField(default=timezone.now)
    remover = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='remover%(app_label)s_%(class)s_related', null=True, blank=True)
    removed = models.DateTimeField(null=True, blank=True)

    permissions_organization_add = models.BooleanField(default=False)
    permissions_user_add = models.BooleanField(default=False)

    def can_add_organization(self):
        """
        Return true if members of this organization can add organizations to this mission
        """
        return self.permissions_organization_add

    def can_add_user(self):
        """
        Return true if members of this organization can add users to this mission
        """
        return self.permissions_user_add

    def as_json(self):
        """
        return this mission organization as a json object
        """
        return {
            'mission': self.mission.pk,
            'organization': self.organization.as_object(),
            'creator': str(self.creator),
            'added': self.added,
            'permissions': {
                'add_organization': self.can_add_organization(),
                'add_user': self.can_add_user(),
            }
        }

    @classmethod
    def mission_user(cls, user):
        """
        Get all the missions a user is in because they are in an organization
        """
        user_organizations = OrganizationMember.user_current(user)
        return Mission.objects.filter(missionorganization__organization__in=[user_org.organization for user_org in user_organizations], missionorganization__removed__isnull=True)
