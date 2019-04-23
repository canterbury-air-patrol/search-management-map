"""
URLs for the map

This is mapped in at the top level
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.map_main, name='map_main'),
    url(r'^record/$', views.recording, name='recording'),
]
