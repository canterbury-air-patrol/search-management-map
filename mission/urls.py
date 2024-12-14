"""
URLs for mission management

This is mapped in to /mission
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/details/$', views.mission_details, name='mission_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/timeline/$', views.MissionTimelineView.as_view(), name='mission_timeline'),
    re_path(r'^mission/(?P<mission_id>\d+)/organizations/$', views.MissionOrganizationsView.as_view(), name='mission_organizations'),
    re_path(r'^mission/(?P<mission_id>\d+)/organizations/(?P<organization_id>\d+)/$', views.MissionOrganizationView.as_view(), name='mission_organization'),
    re_path(r'^mission/(?P<mission_id>\d+)/users/add/$', views.mission_user_add, name='mission_user_add'),
    re_path(r'^mission/(?P<mission_id>\d+)/users/(?P<user_id>\d+)/$', views.MissionUserView.as_view(), name='mission_user'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/$', views.MissionAssetsView.as_view()),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/(?P<asset_id>\d+)/remove/$', views.mission_asset_remove, name='mission_assets_remove'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/(?P<asset_id>\d+)/status/$', views.MissionAssetStatusView.as_view()),
    re_path(r'^mission/(?P<mission_id>\d+)/close/$', views.mission_close, name='mission_close'),
    re_path(r'^mission/new/$', views.mission_new, name='mission_new'),
    re_path(r'^mission/list/$', views.mission_list_data, name='mission_list_data'),
    re_path(r'^mission/asset/status/values/$', views.MissionAssetStatusValuesView.as_view()),
    re_path(r'^$', views.mission_list, name='mission_list'),
]
