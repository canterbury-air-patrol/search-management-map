"""
URLs for mission management

This is mapped in to /mission
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/details/$', views.MissionDetailsView.as_view(), name='mission_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/timeline/$', views.MissionTimelineView.as_view(), name='mission_timeline'),
    re_path(r'^mission/(?P<mission_id>\d+)/organizations/$', views.MissionOrganizationsView.as_view(), name='mission_organizations'),
    re_path(r'^mission/(?P<mission_id>\d+)/organizations/(?P<organization_id>\d+)/$', views.MissionOrganizationView.as_view(), name='mission_organization'),
    re_path(r'^mission/(?P<mission_id>\d+)/users/$', views.MissionUsersView.as_view(), name='mission_users'),
    re_path(r'^mission/(?P<mission_id>\d+)/users/(?P<user_id>\d+)/$', views.MissionUserView.as_view(), name='mission_user'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/$', views.MissionAssetsView.as_view()),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/(?P<asset_id>\d+)/$', views.MissionAssetView.as_view(), name='mission_asset'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/(?P<asset_id>\d+)/status/$', views.MissionAssetStatusView.as_view()),
    re_path(r'^mission/(?P<mission_id>\d+)/externalreferences/$', views.MissionExternalReferencesView.as_view(), name='mission_external_references'),
    re_path(r'^mission/(?P<mission_id>\d+)/externalreferences/(?P<ext_ref_id>\d+)/$', views.MissionExternalReferenceView.as_view(), name='mission_external_reference'),
    re_path(r'^mission/(?P<mission_id>\d+)/close/$', views.mission_close, name='mission_close'),
    re_path(r'^mission/new/$', views.MissionNewView.as_view(), name='mission_new'),
    re_path(r'^mission/list/$', views.mission_list_data, name='mission_list_data'),
    re_path(r'^mission/asset/status/values/$', views.MissionAssetStatusValuesView.as_view()),
    re_path(r'^$', views.mission_list, name='mission_list'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/command/set/$', views.AssetCommandSetView.as_view(), name='asset_command_set'),
    re_path(r'^assets/(?P<asset_id>\d+)/command/$', views.AssetCommandView.as_view(), name='assets_command'),
]
