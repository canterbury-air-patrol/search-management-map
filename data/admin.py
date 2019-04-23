"""
Expose data to the admin interface
"""
from django.contrib import admin
from .models import AssetPointTime, PointTimeLabel


class AssetPointTimeAdmin(admin.ModelAdmin):
    """
    Allow admins to inject/delete Asset position reports
    """
    list_display = ['asset', 'point', 'timestamp', 'deleted', 'creator', 'alt', 'heading', 'fix']


class PointTimeLabelAdmin(admin.ModelAdmin):
    """
    Allow admins to inject POIs
    """
    list_display = ['point', 'timestamp', 'deleted', 'creator', 'replaced_by', 'label']


admin.site.register(AssetPointTime, AssetPointTimeAdmin)
admin.site.register(PointTimeLabel, PointTimeLabelAdmin)
