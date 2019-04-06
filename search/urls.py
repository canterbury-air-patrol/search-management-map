from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^sector/incomplete/$', views.sector_search_incomplete, name='sector_search_incomplete'),
    url(r'^sector/completed/$', views.sector_search_completed, name='sector_search_completed'),
    url(r'^sector/create/$', views.sector_search_create, name='sector_search_create'),
    url(r'^expandingbox/incomplete/$', views.expanding_box_search_incomplete, name='expanding_box_search_incomplete'),
    url(r'^expandingbox/completed/$', views.expanding_box_search_completed, name='expanding_box_search_completed'),
    url(r'^expandingbox/create/$', views.expanding_box_search_create, name='expanding_box_search_create'),
    url(r'^trackline/incomplete/$', views.track_line_search_incomplete, name='track_line_search_incomplete'),
    url(r'^trackline/completed/$', views.track_line_search_completed, name='track_line_search_completed'),
    url(r'^trackline/create/$', views.track_line_search_create, name='track_line_search_create'),
    url(r'^creepingline/incomplete/$', views.creeping_line_search_incomplete, name='creeping_line_search_incomplete'),
    url(r'^creepingline/completed/$', views.creeping_line_search_completed, name='creeping_line_search_completed'),
    url(r'^creepingline/create/track/$', views.track_creeping_line_search_create, name='track_creeping_line_search_create'),
]
