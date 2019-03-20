from django.contrib import admin
from .models import AssetPointTime


class AssetPointTimeAdmin(admin.ModelAdmin):
    list_display = ['asset', 'point', 'timestamp', 'deleted', 'creator', 'alt', 'heading', 'fix']


admin.site.register(AssetPointTime, AssetPointTimeAdmin)
