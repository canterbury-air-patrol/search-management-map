"""
URLs for mission management

This is mapped in to /mission
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/details/$', views.mission_details, name='mission_details'),
    url(r'^mission/(?P<mission_id>\d+)/timeline/$', views.mission_timeline, name='mission_timeline'),
    url(r'^mission/(?P<mission_id>\d+)/timeline/add/$', views.mission_timeline_add, name='mission_timeline_add'),
    url(r'^mission/(?P<mission_id>\d+)/users/add/$', views.mission_user_add, name='mission_user_add'),
    url(r'^mission/(?P<mission_id>\d+)/users/(?P<user_id>\d+)/make/admin/$', views.mission_user_make_admin, name='mission_user_make_admin'),
    url(r'^mission/(?P<mission_id>\d+)/assets/add/$', views.mission_asset_add, name='mission_assets_add'),
    url(r'^mission/(?P<mission_id>\d+)/assets/json/$', views.mission_asset_json, name='mission_assets_json'),
    url(r'^mission/(?P<mission_id>\d+)/assets/(?P<asset_id>\d+)/remove/$', views.mission_asset_remove, name='mission_assets_remove'),
    url(r'^mission/(?P<mission_id>\d+)/close/$', views.mission_close, name='mission_close'),
    url(r'^mission/new/$', views.mission_new, name='mission_new'),
    url(r'^$', views.mission_list, name='mission_list'),
]
