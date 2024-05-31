"""
Expose mission related models to the admin interface
"""

from django.contrib import admin
from .models import MissionAssetStatusValue


class MissionAssetStatusValueAdmin(admin.ModelAdmin):
    """
    Allow admins to create mission asset status values
    """
    list_display = ['name', 'description']


admin.site.register(MissionAssetStatusValue, MissionAssetStatusValueAdmin)
