"""
Expose data to the admin interface
"""
from django.contrib import admin
from .models import AssetPointTime, GeoTimeLabel


class AssetPointTimeAdmin(admin.ModelAdmin):
    """
    Allow admins to inject/delete Asset position reports
    """
    list_display = ['asset', 'geo', 'created_at', 'created_by', 'heading', 'fix']


class PointTimeLabelAdmin(admin.ModelAdmin):
    """
    Allow admins to inject Labelled Geometries
    """
    list_display = ['geo', 'created_at', 'created_by', 'replaced_by', 'label']


admin.site.register(AssetPointTime, AssetPointTimeAdmin)
admin.site.register(GeoTimeLabel, PointTimeLabelAdmin)
