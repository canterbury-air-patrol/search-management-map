from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^sector/incomplete/$', views.sector_search_incomplete, name='sector_search_incomplete'),
    url(r'^sector/completed/$', views.sector_search_completed, name='sector_search_completed'),
    url(r'^sector/create/$', views.sector_search_create, name='sector_search_create'),
    url(r'^sector/(?P<id>\d+)/json/$', views.sector_search_json, name='sector_search_json'),
    url(r'^sector/(?P<id>\d+)/begin/$', views.sector_search_begin, name='sector_search_begin'),
    url(r'^expandingbox/incomplete/$', views.expanding_box_search_incomplete, name='expanding_box_search_incomplete'),
    url(r'^expandingbox/completed/$', views.expanding_box_search_completed, name='expanding_box_search_completed'),
    url(r'^expandingbox/create/$', views.expanding_box_search_create, name='expanding_box_search_create'),
    url(r'^expandingbox/(?P<id>\d+)/json/$', views.expanding_box_search_json, name='expanding_box_search_json'),
    url(r'^expandingbox/(?P<id>\d+)/begin/$', views.expanding_box_search_begin, name='expanding_box_search_begin'),
    url(r'^trackline/incomplete/$', views.track_line_search_incomplete, name='track_line_search_incomplete'),
    url(r'^trackline/completed/$', views.track_line_search_completed, name='track_line_search_completed'),
    url(r'^trackline/create/$', views.track_line_search_create, name='track_line_search_create'),
    url(r'^trackline/(?P<id>\d+)/json/$', views.track_line_search_json, name='track_line_search_json'),
    url(r'^trackline/(?P<id>\d+)/begin/$', views.track_line_search_begin, name='track_line_search_begin'),
    url(r'^creepingline/track/incomplete/$', views.creeping_line_track_search_incomplete, name='creeping_line_track_search_incomplete'),
    url(r'^creepingline/track/completed/$', views.creeping_line_track_search_completed, name='creeping_line_track_search_completed'),
    url(r'^creepingline/create/track/$', views.track_creeping_line_search_create, name='track_creeping_line_search_create'),
    url(r'^creepingline/track/(?P<id>\d+)/json/$', views.creeping_line_track_search_json, name='creeping_line_track_search_json'),
    url(r'^creepingline/track/(?P<id>\d+)/begin/$', views.creeping_line_track_search_begin, name='creeping_line_track_search_begin'),
    url(r'^find/closest/$', views.find_closest_search, name='find_closest_search'),
]
