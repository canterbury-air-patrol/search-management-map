from django.contrib import admin
from .models import AssetPointTime, PointTimeLabel


class AssetPointTimeAdmin(admin.ModelAdmin):
    list_display = ['asset', 'point', 'timestamp', 'deleted', 'creator', 'alt', 'heading', 'fix']


class PointTimeLabelAdmin(admin.ModelAdmin):
    list_display = ['point', 'timestamp', 'deleted', 'creator', 'replaced_by', 'label']


admin.site.register(AssetPointTime, AssetPointTimeAdmin)
admin.site.register(PointTimeLabel, PointTimeLabelAdmin)
