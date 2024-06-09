"""
Urls for data

These are linked in at /data/
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/data/assets/positions/latest/$', views.assets_position_latest, name='assets_position_latest'),
    re_path(r'^data/assets/(?P<asset_id>\d+)/position/add/$', views.asset_record_position, name='asset_record_position'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/assets/(?P<asset_id>\d+)/position/history/$', views.asset_position_history_mission, name='asset_position_history'),

    re_path(r'^mission/(?P<mission_id>\d+)/data/users/positions/latest/$', views.users_position_latest, name='users_position_latest'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/user/(?P<user>.*)/position/add/$', views.user_record_position, name='user_position_record'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/user/(?P<user>.*)/position/history/$', views.user_position_history_mission, name='user_position_history'),

    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/current/$', views.data_all_specific_mission_type, {'geo_type': 'poi'}),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/current/kml/$', views.point_labels_all_kml, name='point_labels_all_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/pois/create/$', views.point_label_create, name='point_label_create'),
    re_path(r'^data/pois/(?P<geo_id>\d+)/replace/$', views.point_label_replace, {'geo_type': 'poi'}, name='point_label_replace'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/current/$', views.data_all_specific_mission_type, {'geo_type': 'polygon'}),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/current/kml/$', views.user_polygons_all_kml, name='user_polygons_all_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userpolygons/create/$', views.user_polygon_create, name='user_polygon_create'),
    re_path(r'^data/userpolygons/(?P<geo_id>\d+)/replace/$', views.user_polygon_replace, {'geo_type': 'polygon'}, name='user_polygon_replace'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/current/$', views.data_all_specific_mission_type, {'geo_type': 'line'}),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/current/kml/$', views.user_lines_all_kml, name='user_lines_all_kml'),
    re_path(r'^mission/(?P<mission_id>\d+)/data/userlines/create/$', views.user_line_create, name='user_line_create'),
    re_path(r'^data/userlines/(?P<geo_id>\d+)/replace/$', views.user_line_replace, {'geo_type': 'line'}, name='user_line_replace'),

    re_path(r'^data/usergeo/(?P<geo_id>\d+)/$', views.GeoDataView.as_view()),

    re_path(r'^mission/(?P<mission_id>\d+)/data/assets/typhoon/upload/$', views.upload_typhoonh_data, name='upload_typhoonh_data'),

    re_path(r'^mission/all/data/assets/positions/latest/$', views.assets_position_latest_user, {'current_only': False}),
    re_path(r'^mission/all/data/assets/(?P<asset_id>\d+)/position/history/$', views.asset_position_history_user, {'current_only': False}),
    re_path(r'^mission/all/data/users/positions/latest/$', views.users_position_latest_user, {'current_only': False}),
    re_path(r'^mission/all/data/users/(?P<user>.*)/position/history/$', views.user_position_history_user, {'current_only': False}),
    re_path(r'^mission/all/data/pois/current/$', views.data_all_all_missions_type, {'geo_type': 'poi'}),
    re_path(r'^mission/all/data/userpolygons/current/$', views.data_all_all_missions_type, {'geo_type': 'polygon'}),
    re_path(r'^mission/all/data/userlines/current/$', views.data_all_all_missions_type, {'geo_type': 'line'}),

    re_path(r'^mission/current/data/assets/positions/latest/$', views.assets_position_latest_user, {'current_only': True}),
    re_path(r'^mission/current/data/assets/(?P<asset_id>\d+)/position/history/$', views.asset_position_history_user, {'current_only': True}),
    re_path(r'^mission/current/data/users/positions/latest/$', views.users_position_latest_user, {'current_only': True}),
    re_path(r'^mission/current/data/users/(?P<user>.*)/position/history/$', views.user_position_history_user, {'current_only': True}),
    re_path(r'^mission/current/data/pois/current/$', views.data_all_current_missions_type, {'geo_type': 'poi'}),
    re_path(r'^mission/current/data/userpolygons/current/$', views.data_all_current_missions_type, {'geo_type': 'polygon'}),
    re_path(r'^mission/current/data/userlines/current/$', views.data_all_current_missions_type, {'geo_type': 'line'}),
]
