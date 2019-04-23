"""
Expose assets to the admin interface
"""

from django.contrib import admin
from .models import Asset, AssetType


class AssetAdmin(admin.ModelAdmin):
    """
    Allow admins to create assets
    """
    list_display = ['name', 'owner', 'asset_type']


class AssetTypeAdmin(admin.ModelAdmin):
    """
    Allow admins to create asset types
    """
    list_display = ['name', 'description']


admin.site.register(Asset, AssetAdmin)
admin.site.register(AssetType, AssetTypeAdmin)
