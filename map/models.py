"""
Models for the map
"""

from django.contrib.gis.db import models


class MapTileLayer(models.Model):
    """
    A tile layer on the map
    """
    name = models.TextField()
    url = models.TextField()
    base = models.BooleanField(default=False)
    attribution = models.TextField(null=True, blank=True)
    minZoom = models.IntegerField(default=0)
    maxZoom = models.IntegerField(default=16)
    subdomains = models.TextField(null=True, blank=True)

    active = models.BooleanField(default=True)
    relativeOrder = models.IntegerField()
