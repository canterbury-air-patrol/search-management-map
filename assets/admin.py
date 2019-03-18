from django.contrib import admin
from .models import Asset, AssetType


class AssetAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'asset_type']


class AssetTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']


admin.site.register(Asset, AssetAdmin)
admin.site.register(AssetType, AssetTypeAdmin)
