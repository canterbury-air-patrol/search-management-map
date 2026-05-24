"""
Models for missions (and mission membership)
"""

from django.contrib.gis.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

from assets.models import Asset, AssetType
from organization.models import Organization, OrganizationMember
from timeline.helpers import timeline_record_asset_command_response, timeline_record_asset_command_sent


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

    def as_object(self):
        """
        return this mission user as a json object
        """
        return {
            'id': self.pk,
            'mission': self.mission.pk,
            'user': str(self.user),
            'user_id': self.user.pk,  # pylint: disable=E1101
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

    class Meta:
        indexes = [
            models.Index(fields=['mission', 'user']),
        ]


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

    def as_object(self):
        """
        return this mission asset as a json object
        """
        return {
            'id': self.pk,
            'mission': self.mission.pk,
            'asset': self.asset.as_object(),
            'creator': str(self.creator) if self.creator else None,
            'added': self.added,
            'remover': str(self.remover) if self.remover else None,
            'removed': self.removed,
        }

    class Meta:
        indexes = [
            models.Index(fields=['mission', 'asset', 'removed']),
        ]


class AssetCommand(models.Model):
    """
    An instruction for the asset

    This provides a mechanism for letting an
    asset know about changes to the plan.
    i.e. The mission has been completed.
    """
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)
    issued = models.DateTimeField(default=timezone.now)
    issued_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='created_by%(app_label)s_%(class)s_related')
    COMMAND_CHOICES = (
        ('RTL', "Return To Launch"),
        ('RON', "Continue"),  # Resume own navigation
        ('CIR', "Circle"),
        ('GOTO', "Goto position"),
        ('MC', "Mission Complete"),  # Return to Base
        ('AS', "Abandon Search"),  # Reassignment
    )
    command = models.CharField(max_length=4, choices=COMMAND_CHOICES)
    REQUIRES_POSITION = ('GOTO',)
    position = models.PointField(geography=True, null=True, blank=True)
    reason = models.TextField()
    responded_at = models.DateTimeField(blank=True, null=True)
    responded_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='responder%(app_label)s_%(class)s_related', null=True, blank=True)
    response_type = models.CharField(max_length=10, null=True, blank=True)
    response_message = models.TextField(null=True, blank=True)

    mission = models.ForeignKey(Mission, on_delete=models.PROTECT, null=True)

    GEOFIELD = 'position'
    GEOJSON_FIELDS = ('asset', 'issued', 'issued_by', 'command', 'reason', 'responded_at', 'responded_by', 'response_type', 'response_message')

    def get_command_display(self):
        """
        Convert the command to the human readable name
        """
        return next(
            (row[1] for row in self.COMMAND_CHOICES if row[0] == self.command),
            "Unknown",
        )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.mission is not None:
            if self.responded_at is not None:
                timeline_record_asset_command_response(self.mission, self.responded_by, self.asset, self.get_command_display(), self.response_type, self.response_message)
            else:
                timeline_record_asset_command_sent(self.mission, self.issued_by, self.asset, self.get_command_display(), self.reason, self.position)

    def __str__(self):
        return f"Command {self.asset} to {self.get_command_display()}"

    @staticmethod
    def last_command_for_asset(asset):
        """
        Find the current command that applies to an asset
        """
        try:
            return AssetCommand.objects.filter(asset=asset).order_by('-issued')[0]
        except IndexError:
            return None

    @staticmethod
    def last_command_for_asset_to_json(asset):
        """
        Find the current command that applies to an asset
        Return in the a structure for json
        """
        last_command = {}
        if asset_command := AssetCommand.last_command_for_asset(asset):
            last_command = {
                'action': asset_command.command,
                'action_txt': asset_command.get_command_display(),
                'reason': asset_command.reason,
                'issued': asset_command.issued,
                'issued_by': str(asset_command.issued_by),
                'id': asset_command.pk,
                'response': {
                    'set': asset_command.responded_at,
                    'by': str(asset_command.responded_by),
                    'type': asset_command.response_type,
                    'message': asset_command.response_message,
                }
            }
            if asset_command.position:
                last_command['latitude'] = asset_command.position.y
                last_command['longitude'] = asset_command.position.x
        return last_command


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

    def as_object(self):
        """
        return this mission asset type as a json object
        """
        return {
            'id': self.pk,
            'mission': self.mission.pk,
            'asset_type': self.asset_type.as_object(),
            'creator': str(self.creator) if self.creator else None,
            'added': self.added,
            'remover': str(self.remover) if self.remover else None,
            'removed': self.removed,
        }


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
            models.Index(fields=['mission_asset', '-since']),
        ]


class MissionExternalReference(models.Model):
    """
    Link or Reference to an external agency or document(s)
    """
    mission = models.ForeignKey(Mission, on_delete=models.PROTECT)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='created_by%(app_label)s_%(class)s_related')
    created_at = models.DateTimeField(default=timezone.now)
    deleted_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, null=True, blank=True, related_name='deletor%(app_label)s_%(class)s_related')
    deleted_at = models.DateTimeField(null=True, blank=True)
    replaced_by = models.ForeignKey("MissionExternalReference", on_delete=models.SET_NULL, null=True, blank=True)
    replaced_at = models.DateTimeField(null=True, blank=True)
    name = models.TextField()
    code = models.TextField(null=True, blank=True)
    url = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def as_object(self):
        """
        Convert this mission external reference to an object that is suitable for returning via JsonResponse
        """
        data = {
            "id": self.pk,
            "mission": self.mission.pk,
            "created_by": str(self.created_by),
            "created_at": self.created_at,
            "name": self.name,
            "code": self.code,
            "url": self.url,
            "notes": self.notes,
        }
        if self.deleted_at:
            data["deleted_by"] = str(self.deleted_by)
            data["deleted_at"] = self.deleted_at
        if self.replaced_by:
            data["replaced_by"] = self.replaced_by.pk
            data["replaced_at"] = self.replaced_at
        return data

    class Meta:
        indexes = [
            models.Index(fields=['mission', 'deleted_at', 'replaced_at']),
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

    def as_object(self):
        """
        return this mission organization as a json object
        """
        return {
            'id': self.pk,
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
        org_ids = OrganizationMember.objects.filter(user=user, removed__isnull=True).values('organization')
        return Mission.objects.filter(
            missionorganization__organization__in=org_ids,
            missionorganization__removed__isnull=True,
        )

    class Meta:
        indexes = [
            models.Index(fields=['mission', 'organization', 'removed']),
        ]
