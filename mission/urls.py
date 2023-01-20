"""
URLs for mission management

This is mapped in to /mission
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/details/$', views.mission_details, name='mission_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/timeline/$', views.mission_timeline, name='mission_timeline'),
    re_path(r'^mission/(?P<mission_id>\d+)/timeline/add/$', views.mission_timeline_add, name='mission_timeline_add'),
    re_path(r'^mission/(?P<mission_id>\d+)/timeline/json/$', views.mission_timeline_json, name='mission_timeline_json'),
    re_path(r'^mission/(?P<mission_id>\d+)/organizations/add/$', views.mission_organization_add, name='mission_organization_add'),
    re_path(r'^mission/(?P<mission_id>\d+)/users/add/$', views.mission_user_add, name='mission_user_add'),
    re_path(r'^mission/(?P<mission_id>\d+)/users/(?P<user_id>\d+)/make/admin/$', views.mission_user_make_admin, name='mission_user_make_admin'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/add/$', views.mission_asset_add, name='mission_assets_add'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/json/$', views.mission_asset_json, name='mission_assets_json'),
    re_path(r'^mission/(?P<mission_id>\d+)/assets/(?P<asset_id>\d+)/remove/$', views.mission_asset_remove, name='mission_assets_remove'),
    re_path(r'^mission/(?P<mission_id>\d+)/close/$', views.mission_close, name='mission_close'),
    re_path(r'^mission/new/$', views.mission_new, name='mission_new'),
    re_path(r'^mission/list/$', views.mission_list_data, name='mission_list_data'),
    re_path(r'^$', views.mission_list, name='mission_list'),
]
