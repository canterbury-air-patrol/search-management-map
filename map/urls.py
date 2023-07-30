"""
URLs for the map

This is mapped in at the top level
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/map/$', views.map_main, name='map_main'),
    re_path(r'^mission/current/map/$', views.map_main_current, name='map_main_current'),
    re_path(r'^mission/all/map/$', views.map_main_all, name='map_main_all'),
    re_path(r'map/tile/layers/$', views.tile_layer_list),
]
