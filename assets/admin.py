"""
Expose assets to the admin interface
"""

from django.contrib import admin
from .models import Asset, AssetType, AssetCommand


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


class AssetCommandAdmin(admin.ModelAdmin):
    """
    Allow admins to create asset commands
    """
    list_display = ['asset', 'command', 'reason', 'issued', 'issued_by', 'position']


admin.site.register(Asset, AssetAdmin)
admin.site.register(AssetType, AssetTypeAdmin)
admin.site.register(AssetCommand, AssetCommandAdmin)
