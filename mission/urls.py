"""
URLs for mission management

This is mapped in to /mission
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/details/$', views.mission_details, name='mission_details'),
    url(r'^mission/(?P<mission_id>\d+)/close/$', views.mission_close, name='mission_close'),
    url(r'^mission/new/$', views.mission_new, name='mission_new'),
    url(r'^$', views.mission_list, name='mission_list'),
]
