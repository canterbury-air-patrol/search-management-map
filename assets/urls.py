"""
Urls for assets

These are linked in at /
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^assets/assettypes/json/$', views.asset_types_list, name='asset_types_list'),
    url(r'^assets/mine/json/$', views.assets_mine_list, name='assets_mine_list'),
    url(r'^mission/(?P<mission_id>\d+)/assets/command/set/$', views.asset_command_set, name='asset_command_set'),
]
