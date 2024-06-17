"""
Urls for search management

These are linked at /search/
"""
from django.urls import re_path
from . import views
from .models import Search

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/search/notstarted/$', views.search_notstarted, {'search_class': Search}, name='search_notstarted'),
    re_path(r'^mission/(?P<mission_id>\d+)/search/notstarted/kml/$', views.search_notstarted_kml, {'search_class': Search}, name='search_notstarted_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/search/inprogress/$', views.search_inprogress, {'search_class': Search}, name='search_inprogress'),
    re_path(r'^mission/(?P<mission_id>\d+)/search/inprogress/kml/$', views.search_inprogress_kml, {'search_class': Search}, name='search_inprogress_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/search/completed/$', views.search_completed, {'search_class': Search}, name='search_completed'),
    re_path(r'^mission/(?P<mission_id>\d+)/search/completed/kml/$', views.search_completed_kml, {'search_class': Search}, name='search_completed_kml'),
    re_path(r'^search/(?P<search_id>\d+)/$', views.SearchView.as_view(), name='search_view'),
    re_path(r'^search/(?P<search_id>\d+)/queue/$', views.search_queue, name='search_queue'),
    re_path(r'^search/(?P<search_id>\d+)/begin/$', views.search_begin, {'object_class': Search}, name='search_begin'),
    re_path(r'^search/(?P<search_id>\d+)/finished/$', views.search_finished, {'object_class': Search}, name='search_finished'),
    re_path(r'^search/sector/create/$', views.sector_search_create, name='sector_search_create'),
    re_path(r'^search/expandingbox/create/$', views.expanding_box_search_create, name='expanding_box_search_create'),
    re_path(r'^search/trackline/create/$', views.track_line_search_create, name='track_line_search_create'),
    re_path(r'^search/shoreline/create/$', views.shore_line_search_create, name='shore_line_search_create'),
    re_path(r'^search/creepingline/create/track/$', views.track_creeping_line_search_create, name='track_creeping_line_search_create'),
    re_path(r'^search/creepingline/create/polygon/$', views.polygon_creeping_line_search_create, name='polygon_creeping_line_search_create'),
    re_path(r'^search/find/closest/$', views.find_next_search, name='find_next_search'),

    re_path(r'^mission/all/search/notstarted/$', views.search_notstarted_user, {'search_class': Search, 'current_only': False}),
    re_path(r'^mission/all/search/inprogress/$', views.search_inprogress_user, {'search_class': Search, 'current_only': False}),
    re_path(r'^mission/all/search/completed/$', views.search_completed_user, {'search_class': Search, 'current_only': False}),
    re_path(r'^mission/current/search/notstarted/$', views.search_notstarted_user, {'search_class': Search, 'current_only': True}),
    re_path(r'^mission/current/search/inprogress/$', views.search_inprogress_user, {'search_class': Search, 'current_only': True}),
    re_path(r'^mission/current/search/completed/$', views.search_completed_user, {'search_class': Search, 'current_only': True}),
]
