"""
Urls for assets

These are linked in at /
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^assets/assettypes/$', views.AssetsTypeView.as_view(), name='asset_types_view'),
    re_path(r'^assets/$', views.AssetsView.as_view(), name='assets_view'),
    re_path(r'^assets/(?P<asset_id>\d+)/$', views.AssetView.as_view(), name='asset_view'),
    re_path(r'^assets/(?P<asset_id>\d+)/status/$', views.asset_status, name='assets_status'),
    re_path(r'^assets/(?P<asset_id>\d+)/command/$', views.AssetCommandView.as_view(), name='assets_command'),
    re_path(r'^assets/status/values/$', views.assets_status_value_list, name='asset_status_values_list'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/command/set/$', views.asset_command_set, name='asset_command_set'),
]
