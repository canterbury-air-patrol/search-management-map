"""
models for assets

Assets are things that can do searches
- boats
- aeroplanes
- people
- etc
"""

from django.contrib.gis.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

from icons.models import Icon
from timeline.helpers import timeline_record_asset_command_response, timeline_record_asset_command_sent


class AssetType(models.Model):
    """
    A type of asset.

    These are used for grouping assets. Then searches can be set to
    being for an asset type and any available asset from that type
    can pickup the search.
    """
    name = models.CharField(max_length=50)
    description = models.TextField()
    icon = models.ForeignKey(Icon, on_delete=models.SET_NULL, null=True, blank=True)

    def as_object(self):
        """
        Convert this asset type to an object that is suitable for returning via JsonResponse
        """
        return {
            'id': self.pk,
            'name': self.name,
        }

    def natural_key(self):
        """
        Use the asset type name when refering to the asset type during serialization (i.e. to geojson).
        """
        return self.name

    def __str__(self):
        return self.name


class Asset(models.Model):
    """
    A specific asset.
    """
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)
    asset_type = models.ForeignKey(AssetType, on_delete=models.PROTECT)
    icon = models.ForeignKey(Icon, on_delete=models.SET_NULL, null=True, blank=True)

    def icon_url(self):
        """
        Return the icon url for this asset
        """
        if self.icon is not None:
            return self.icon.get_url()
        if self.asset_type.icon is not None:
            return self.asset_type.icon.get_url()
        return None

    def as_object(self):
        """
        Convert this asset to an object that is suitable for returning via JsonResponse
        """
        data = {
            'id': self.pk,
            'name': self.name,
            'type_id': self.asset_type.id,
            'type_name': self.asset_type.name,
            'owner': str(self.owner)
        }
        if status := AssetStatus.current_for_asset(self):
            data['status'] = str(status.status)
            data['status_inop'] = status.status.inop
            data['status_since'] = status.since
        icon_url = self.icon_url()
        if icon_url is not None:
            data['icon_url'] = icon_url
        return data

    def natural_key(self):
        """
        Use the asset id when referring to the asset during serialization (i.e. to geojson).
        """
        return self.pk

    def __str__(self):
        return self.name


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

    mission = models.ForeignKey('mission.Mission', on_delete=models.PROTECT, null=True)

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


class AssetStatusValue(models.Model):
    """
    A possible status for an asset

    This provides a common set of statuses for asset owners to use to
    report the status of assets to other users.

    Assets with a current status value that is marked as in-op won't
    be able to be added to missions.
    i.e. for assets that are undergoing maintenance, have been retired, etc
    """
    name = models.CharField(max_length=30, unique=True)
    inop = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)

    def as_object(self):
        """
        Convert this asset status value to an object that is suitable for returning via JsonResponse
        """
        return {
            'id': self.pk,
            'name': self.name,
            'inop': self.inop,
            'description': self.description
        }

    def __str__(self):
        return self.name


class AssetStatus(models.Model):
    """
    The status of an asset at a specific time

    These keep track of the asset status over time
    """
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)
    status = models.ForeignKey(AssetStatusValue, on_delete=models.PROTECT)
    since = models.DateTimeField(default=timezone.now)
    notes = models.TextField(null=True, blank=True)

    def as_object(self):
        """
        Convert this asset status to an object that is suitable for returning via JsonResponse
        """
        return {
            'id': self.pk,
            'asset': self.asset.name,
            'asset_id': self.asset.pk,
            'status': self.status.name,
            'inop': self.status.inop,
            'since': self.since,
            'notes': self.notes
        }

    def __str__(self):
        return f'{self.asset.name} is {self.status.name}'

    @classmethod
    def current_for_asset(cls, asset):
        """
        Get the most recent status for an asset
        """
        try:
            return cls.objects.filter(asset=asset).latest('since')
        except cls.DoesNotExist:
            return None

    class Meta:
        indexes = [
            models.Index(fields=['asset']),
            models.Index(fields=['since']),
        ]
