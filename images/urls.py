"""
URLs for images

This is mapped in at the top level
"""

from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/image/upload/$', views.image_upload, name='image_upload'),
    re_path(r'^mission/(?P<mission_id>\d+)/image/list/all/$', views.images_list_all, name='images_list_all'),
    re_path(r'^mission/(?P<mission_id>\d+)/image/list/important/$', views.images_list_important, name='images_list_important'),
    re_path(r'^image/(?P<image_id>\d+)/full/$', views.image_get_full, name='image_get_full'),
    re_path(r'^image/(?P<image_id>\d+)/thumbnail/$', views.image_get_thumbnail, name='image_get_thumbnail'),
    re_path(r'^image/(?P<image_id>\d+)/priority/set/$', views.image_priority_set, name='image_priority_set'),
    re_path(r'^image/(?P<image_id>\d+)/priority/unset/$', views.image_priority_unset, name='image_priority_unset'),

    re_path(r'^mission/all/image/list/all/$', views.images_list_all_user, {'current_only': False}),
    re_path(r'^mission/all/image/list/important/$', views.images_list_important_user, {'current_only': False}),
    re_path(r'^mission/current/image/list/all/$', views.images_list_all_user, {'current_only': True}),
    re_path(r'^mission/current/image/list/important/$', views.images_list_important_user, {'current_only': True}),
]
