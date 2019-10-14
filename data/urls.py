"""
Urls for data

These are linked in at /data/
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/data/assets/positions/latest/$', views.assets_position_latest, name='assets_position_latest'),
    url(r'^data/assets/(?P<asset_name>.*)/position/add/$', views.asset_record_position, name='asset_record_position'),
    url(r'^mission/(?P<mission_id>\d+)/data/assets/(?P<asset_name>.*)/position/history/$', views.asset_position_history, name='asset_position_history'),
    url(r'^mission/(?P<mission_id>\d+)/data/pois/current/$', views.point_labels_all, name='point_labels_all'),
    url(r'^mission/(?P<mission_id>\d+)/data/pois/current/kml/$', views.point_labels_all_kml, name='point_labels_all_kml'),
    url(r'^mission/(?P<mission_id>\d+)/data/pois/create/$', views.point_label_create, name='point_label_create'),
    url(r'^mission/(?P<mission_id>\d+)/data/pois/(?P<poi>\d+)/replace/$', views.point_label_replace, name='point_label_replace'),
    url(r'^mission/(?P<mission_id>\d+)/data/pois/(?P<poi>\d+)/delete/$', views.point_label_delete, name='point_label_delete'),
    url(r'^mission/(?P<mission_id>\d+)/data/userpolygons/current/$', views.user_polygons_all, name='user_polygons_all'),
    url(r'^mission/(?P<mission_id>\d+)/data/userpolygons/current/kml/$', views.user_polygons_all_kml, name='user_polygons_all_kml'),
    url(r'^mission/(?P<mission_id>\d+)/data/userpolygons/create/$', views.user_polygon_create, name='user_polygon_create'),
    url(r'^mission/(?P<mission_id>\d+)/data/userpolygons/(?P<polygon>\d+)/replace/$', views.user_polygon_replace, name='user_polygon_replace'),
    url(r'^mission/(?P<mission_id>\d+)/data/userpolygons/(?P<polygon>\d+)/delete/$', views.user_polygon_delete, name='user_polygon_delete'),
    url(r'^mission/(?P<mission_id>\d+)/data/userlines/current/$', views.user_lines_all, name='user_lines_all'),
    url(r'^mission/(?P<mission_id>\d+)/data/userlines/current/kml/$', views.user_lines_all_kml, name='user_lines_all_kml'),
    url(r'^mission/(?P<mission_id>\d+)/data/userlines/create/$', views.user_line_create, name='user_line_create'),
    url(r'^mission/(?P<mission_id>\d+)/data/userlines/(?P<line>\d+)/replace/$', views.user_line_replace, name='user_line_replace'),
    url(r'^mission/(?P<mission_id>\d+)/data/userlines/(?P<line>\d+)/delete/$', views.user_line_delete, name='user_line_delete'),
    url(r'^mission/(?P<mission_id>\d+)/data/assets/typhoon/upload/$', views.upload_typhoonh_data, name='upload_typhoonh_data'),
]
