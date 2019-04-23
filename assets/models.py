"""
models for assets

Assets are things that can do searches
- boats
- aeroplanes
- people
- etc
"""

from django.db import models
from django.contrib.auth import get_user_model


class AssetType(models.Model):
    """
    A type of asset.

    These are used for grouping assets. Then searches can be set to
    being for an asset type and any available asset from that type
    can pickup the search.
    """
    name = models.CharField(max_length=50)
    description = models.TextField()

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
