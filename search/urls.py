"""
Urls for search management

These are linked at /search/
"""
from django.conf.urls import url
from . import views, view_helpers
from .models import Search

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/search/incomplete/$', views.search_incomplete, {'search_class': Search}, name='search_incomplete'),
    url(r'^mission/(?P<mission_id>\d+)/search/incomplete/kml/$', views.search_incomplete_kml, {'search_class': Search}, name='search_incomplete_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/completed/$', views.search_completed, {'search_class': Search}, name='search_completed'),
    url(r'^mission/(?P<mission_id>\d+)/search/completed/kml/$', views.search_completed_kml, {'search_class': Search}, name='search_completed_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/(?P<search_id>\d+)/queue/for/asset/$', views.search_queue_for_asset, {'object_class': Search}, name='search_queue_for_asset'),
    url(r'^mission/(?P<mission_id>\d+)/search/(?P<search_id>\d+)/queue/for/assettype/$', views.search_queue_for_asset_type, {'object_class': Search}, name='search_queue_for_assetype'),
    url(r'^search/(?P<search_id>\d+)/json/$', view_helpers.search_json, {'object_class': Search}, name='sector_search_json'),
    url(r'^search/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': Search}, name='sector_search_begin'),
    url(r'^search/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': Search}, name='sector_search_finished'),
    url(r'^search/sector/create/$', views.sector_search_create, name='sector_search_create'),
    url(r'^search/expandingbox/create/$', views.expanding_box_search_create, name='expanding_box_search_create'),
    url(r'^search/trackline/create/$', views.track_line_search_create, name='track_line_search_create'),
    url(r'^search/creepingline/create/track/$', views.track_creeping_line_search_create, name='track_creeping_line_search_create'),
    url(r'^search/creepingline/create/polygon/$', views.polygon_creeping_line_search_create, name='polygon_creeping_line_search_create'),
    url(r'^search/find/closest/$', views.find_next_search, name='find_next_search'),
]
