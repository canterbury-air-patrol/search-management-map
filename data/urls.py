from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^assets/positions/latest/$', views.assets_position_latest, name='assets_position_latest'),
    url(r'^assets/(?P<asset_name>.*)/position/add/$', views.asset_record_position, name='asset_record_position'),
    url(r'^assets/(?P<asset_name>.*)/position/history/$', views.asset_position_history, name='asset_position_history'),
    url(r'^pois/current/$', views.point_labels_all, name='point_labels_all'),
    url(r'^pois/create/$', views.point_label_create, name='point_label_create'),
    url(r'^pois/(?P<pk>\d+)/replace/$', views.point_label_replace, name='point_label_replace'),
    url(r'^pois/(?P<pk>\d+)/delete/$', views.point_label_delete, name='point_label_delete'),
    url(r'^userpolygons/current/$', views.user_polygons_all, name='user_polygons_all'),
    url(r'^userpolygons/create/$', views.user_polygon_create, name='user_polygon_create'),
    url(r'^userpolygons/(?P<pk>\d+)/replace/$', views.user_polygon_replace, name='user_polygon_replace'),
    url(r'^userpolygons/(?P<pk>\d+)/delete/$', views.user_polygon_delete, name='user_polygon_delete'),
    url(r'^userlines/current/$', views.user_lines_all, name='user_lines_all'),
    url(r'^userlines/create/$', views.user_line_create, name='user_line_create'),
]
