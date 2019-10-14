"""
Urls for search management

These are linked at /search/
"""
from django.conf.urls import url
from . import views, view_helpers
from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch, PolygonSearch

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/search/sector/incomplete/$', views.sector_search_incomplete, name='sector_search_incomplete'),
    url(r'^mission/(?P<mission_id>\d+)/search/sector/incomplete/kml/$', views.sector_search_incomplete_kml, name='sector_search_incomplete_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/sector/completed/$', views.sector_search_completed, name='sector_search_completed'),
    url(r'^mission/(?P<mission_id>\d+)/search/sector/completed/kml/$', views.sector_search_completed_kml, name='sector_search_completed_kml'),
    url(r'^search/sector/create/$', views.sector_search_create, name='sector_search_create'),
    url(r'^search/sector/(?P<search_id>\d+)/json/$', view_helpers.search_json, {'object_class': SectorSearch}, name='sector_search_json'),
    url(r'^search/sector/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': SectorSearch}, name='sector_search_begin'),
    url(r'^search/sector/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': SectorSearch}, name='sector_search_finished'),
    url(r'^mission/(?P<mission_id>\d+)/search/expandingbox/incomplete/$', views.expanding_box_search_incomplete, name='expanding_box_search_incomplete'),
    url(r'^mission/(?P<mission_id>\d+)/search/expandingbox/incomplete/kml/$', views.expanding_box_search_incomplete_kml, name='expanding_box_search_incomplete_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/expandingbox/completed/$', views.expanding_box_search_completed, name='expanding_box_search_completed'),
    url(r'^mission/(?P<mission_id>\d+)/search/expandingbox/completed/kml/$', views.expanding_box_search_completed_kml, name='expanding_box_search_completed_kml'),
    url(r'^search/expandingbox/create/$', views.expanding_box_search_create, name='expanding_box_search_create'),
    url(r'^search/expandingbox/(?P<search_id>\d+)/json/$', view_helpers.search_json, {'object_class': ExpandingBoxSearch}, name='expanding_box_search_json'),
    url(r'^search/expandingbox/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': ExpandingBoxSearch}, name='expanding_box_search_begin'),
    url(r'^search/expandingbox/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': ExpandingBoxSearch}, name='expanding_box_search_finished'),
    url(r'^mission/(?P<mission_id>\d+)/search/trackline/incomplete/$', views.track_line_search_incomplete, name='track_line_search_incomplete'),
    url(r'^mission/(?P<mission_id>\d+)/search/trackline/incomplete/kml/$', views.track_line_search_incomplete_kml, name='track_line_search_incomplete_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/trackline/completed/$', views.track_line_search_completed, name='track_line_search_completed'),
    url(r'^mission/(?P<mission_id>\d+)/search/trackline/completed/kml/$', views.track_line_search_completed_kml, name='track_line_search_completed_kml'),
    url(r'^search/trackline/create/$', views.track_line_search_create, name='track_line_search_create'),
    url(r'^search/trackline/(?P<search_id>\d+)/json/$', view_helpers.search_json, {'object_class': TrackLineSearch}, name='track_line_search_json'),
    url(r'^search/trackline/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': TrackLineSearch}, name='track_line_search_begin'),
    url(r'^search/trackline/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': TrackLineSearch}, name='track_line_search_finished'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/track/incomplete/$', views.creeping_line_track_search_incomplete, name='creeping_line_track_search_incomplete'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/track/incomplete/kml/$', views.creeping_line_track_search_incomplete_kml, name='creeping_line_track_search_incomplete_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/track/completed/$', views.creeping_line_track_search_completed, name='creeping_line_track_search_completed'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/track/completed/kml/$', views.creeping_line_track_search_completed_kml, name='creeping_line_track_search_completed_kml'),
    url(r'^search/creepingline/create/track/$', views.track_creeping_line_search_create, name='track_creeping_line_search_create'),
    url(r'^search/creepingline/track/(?P<search_id>\d+)/json/$', view_helpers.search_json, {'object_class': TrackLineCreepingSearch}, name='creeping_line_track_search_json'),
    url(r'^search/creepingline/track/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': TrackLineCreepingSearch}, name='creeping_line_track_search_begin'),
    url(r'^search/creepingline/track/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': TrackLineCreepingSearch}, name='creeping_line_track_search_finished'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/polygon/incomplete/$', views.creeping_line_polygon_search_incomplete, name='creeping_line_polygon_search_incomplete'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/polygon/incomplete/kml/$', views.creeping_line_polygon_search_incomplete_kml, name='creeping_line_polygon_search_incomplete_kml'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/polygon/completed/$', views.creeping_line_polygon_search_completed, name='creeping_line_polygon_search_completed'),
    url(r'^mission/(?P<mission_id>\d+)/search/creepingline/polygon/completed/kml/$', views.creeping_line_polygon_search_completed_kml, name='creeping_line_polygon_search_completed_kml'),
    url(r'^search/creepingline/create/polygon/$', views.polygon_creeping_line_search_create, name='polygon_creeping_line_search_create'),
    url(r'^search/creepingline/polygon/(?P<search_id>\d+)/json/$', view_helpers.search_json, {'object_class': PolygonSearch}, name='creeping_line_polygon_search_json'),
    url(r'^search/creepingline/polygon/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': PolygonSearch}, name='creeping_line_polygon_search_begin'),
    url(r'^search/creepingline/polygon/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': PolygonSearch}, name='creeping_line_polygon_search_finished'),
    url(r'^search/find/closest/$', views.find_closest_search, name='find_closest_search'),
]
