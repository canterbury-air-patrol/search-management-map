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


class AssetType(models.Model):
    """
    A type of asset.

    These are used for grouping assets. Then searches can be set to
    being for an asset type and any available asset from that type
    can pickup the search.
    """
    name = models.CharField(max_length=50)
    description = models.TextField()

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

    def natural_key(self):
        """
        Use the asset name when refering to the asset during serialization (i.e. to geojson).
        """
        return self.name

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
    issued_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)
    COMMAND_CHOICES = (
        ('RTL', "Return To Launch"),
        ('RON', "Continue"),  # Resume own navigation
        ('CIR', "Circle"),
        ('GOTO', "Goto position"),
        ('MC', "Mission Complete"), # Return to Base
        ('AS', "Abandon Search"), # Reassignment
    )
    command = models.CharField(max_length=4, choices=COMMAND_CHOICES)
    REQUIRES_POSITION = ('GOTO',)
    position = models.PointField(geography=True, null=True, blank=True)
    reason = models.TextField()
    acknowledged = models.BooleanField(default=False)

    mission = models.ForeignKey('mission.Mission', on_delete=models.PROTECT, null=True)

    GEOFIELD = 'position'
    GEOJSON_FIELDS = ('asset', 'issued', 'issued_by', 'command', 'reason',)

    def __str__(self):
        return "Command {} to {}".format(self.asset, self.get_command_display())

    @staticmethod
    def last_command_for_asset(asset):
        """
        Find the current command that applies to an asset
        """
        try:
            return AssetCommand.objects.filter(asset=asset).order_by('-issued')[0]
        except IndexError:
            return None
