"""
Urls for assets

These are linked in at /assets/
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^assettypes/json/$', views.asset_types_list, name='asset_types_list'),
    url(r'^mine/json/$', views.assets_mine_list, name='assets_mine_list'),
    url(r'^command/set/$', views.asset_command_set, name='asset_command_set'),
]
