"""
Urls for data

These are linked in at /data/
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/data/assets/positions/latest/$', views.assets_position_latest, name='assets_position_latest'),
    re_path(r'^data/assets/(?P<asset_name>.*)/position/add/$', views.asset_record_position, name='asset_record_position'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/assets/(?P<asset_name>.*)/position/history/$', views.asset_position_history_mission, name='asset_position_history'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/current/$', views.data_all_specific_mission_type, {'geo_type': 'poi'}),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/current/kml/$', views.point_labels_all_kml, name='point_labels_all_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/create/$', views.point_label_create, name='point_label_create'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/(?P<poi>\d+)/replace/$', views.point_label_replace, name='point_label_replace'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/(?P<poi>\d+)/delete/$', views.point_label_delete, name='point_label_delete'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/(?P<geo_id>\d+)/details/$', views.usergeo_details, {'geo_type': 'poi'}, name='point_label_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/(?P<geo_id>\d+)/json/$', views.usergeo_json, {'geo_type': 'poi'}, name='point_label_json'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/current/$', views.data_all_specific_mission_type, {'geo_type': 'polygon'}),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/current/kml/$', views.user_polygons_all_kml, name='user_polygons_all_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/create/$', views.user_polygon_create, name='user_polygon_create'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/(?P<polygon>\d+)/replace/$', views.user_polygon_replace, name='user_polygon_replace'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/(?P<polygon>\d+)/delete/$', views.user_polygon_delete, name='user_polygon_delete'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/(?P<geo_id>\d+)/details/$', views.usergeo_details, {'geo_type': 'polygon'}, name='user_polygon_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/(?P<geo_id>\d+)/json/$', views.usergeo_json, {'geo_type': 'polygon'}, name='user_polygon_json'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/current/$', views.data_all_specific_mission_type, {'geo_type': 'line'}),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/current/kml/$', views.user_lines_all_kml, name='user_lines_all_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/create/$', views.user_line_create, name='user_line_create'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/(?P<line>\d+)/replace/$', views.user_line_replace, name='user_line_replace'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/(?P<line>\d+)/delete/$', views.user_line_delete, name='user_line_delete'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/(?P<geo_id>\d+)/details/$', views.usergeo_details, {'geo_type': 'line'}, name='user_line_details'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/(?P<geo_id>\d+)/json/$', views.usergeo_json, {'geo_type': 'line'}, name='user_line_json'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/assets/typhoon/upload/$', views.upload_typhoonh_data, name='upload_typhoonh_data'),

    re_path(r'^mission/all/data/assets/positions/latest/$', views.assets_position_latest_user, {'current_only': False}),
    re_path(r'^mission/all/data/assets/(?P<asset_name>.*)/position/history/$', views.asset_position_history_user, {'current_only': False}),
    re_path(r'^mission/all/data/pois/current/$', views.data_all_all_missions_type, {'geo_type': 'poi'}),
    re_path(r'^mission/all/data/userpolygons/current/$', views.data_all_all_missions_type, {'geo_type': 'polygon'}),
    re_path(r'^mission/all/data/userlines/current/$', views.data_all_all_missions_type, {'geo_type': 'line'}),

    re_path(r'^mission/current/data/assets/positions/latest/$', views.assets_position_latest_user, {'current_only': True}),
    re_path(r'^mission/current/data/assets/(?P<asset_name>.*)/position/history/$', views.asset_position_history_user, {'current_only': True}),
    re_path(r'^mission/current/data/pois/current/$', views.data_all_current_missions_type, {'geo_type': 'poi'}),
    re_path(r'^mission/current/data/userpolygons/current/$', views.data_all_current_missions_type, {'geo_type': 'polygon'}),
    re_path(r'^mission/current/data/userlines/current/$', views.data_all_current_missions_type, {'geo_type': 'line'}),
]
