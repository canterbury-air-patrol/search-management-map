"""
URLs for images

This is mapped in at the top level
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/image/upload/$', views.image_upload, name='image_upload'),
    url(r'^mission/(?P<mission_id>\d+)/image/list/all/$', views.images_list_all, name='images_list_all'),
    url(r'^mission/(?P<mission_id>\d+)/image/list/important/$', views.images_list_important, name='images_list_important'),
    url(r'^mission/(?P<mission_id>\d+)/image/(?P<image_id>\d+)/full/$', views.image_get_full, name='image_get_full'),
    url(r'^mission/(?P<mission_id>\d+)/image/(?P<image_id>\d+)/thumbnail/$', views.image_get_thumbnail, name='image_get_thumbnail'),
    url(r'^mission/(?P<mission_id>\d+)/image/(?P<image_id>\d+)/priority/set/$', views.image_priority_set, name='image_priority_set'),
    url(r'^mission/(?P<mission_id>\d+)/image/(?P<image_id>\d+)/priority/unset/$', views.image_priority_unset, name='image_priority_unset'),

    url(r'^mission/all/image/list/all/$', views.images_list_all_user, {'current_only': False}),
    url(r'^mission/all/image/list/important/$', views.images_list_important_user, {'current_only': False}),
    url(r'^mission/current/image/list/all/$', views.images_list_all_user, {'current_only': True}),
    url(r'^mission/current/image/list/important/$', views.images_list_important_user, {'current_only': True}),
]
