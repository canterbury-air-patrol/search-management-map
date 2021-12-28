"""
Admin of map models
"""

from django.contrib import admin
from .models import MapTileLayer


class MapTileLayerAdmin(admin.ModelAdmin):
    """
    Allow admins to inject/delete Map Tile Layers
    """
    list_display = ['url']


admin.site.register(MapTileLayer, MapTileLayerAdmin)
