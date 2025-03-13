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
