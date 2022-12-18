"""
Urls for assets

These are linked in at /
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^assets/assettypes/json/$', views.asset_types_list, name='asset_types_list'),
    re_path(r'^assets/mine/json/$', views.assets_mine_list, name='assets_mine_list'),
    re_path(r'^assets/(?P<asset_name>.*)/ui/$', views.assets_ui, name='assets_ui'),
    re_path(r'^assets/(?P<asset_name>.*)/details/$', views.asset_details, name='assets_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/command/set/$', views.asset_command_set, name='asset_command_set'),
]
