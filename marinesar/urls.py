"""
Urls for Marine SAR tools

These are linked at /mission/(id)/sar/marine/
"""
from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/$', views.marine_vectors, name='marine_vectors'),
    re_path(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/create/$', views.marine_vectors_create, name='marine_vectors_create'),
    re_path(r'^sar/marine/vectors/(?P<tdv_id>\d+)/delete/$', views.marine_vectors_delete, name='marine_vectors_delete'),
    re_path(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/current/$', views.marine_vectors_all, name='marine_vectors_all'),
    re_path(r'^mission/(?P<mission_id>\d+)/sar/marine/sac/$', views.marine_sac, name='marine_sac'),

    re_path(r'^mission/all/sar/marine/vectors/current/$', views.marine_vectors_all_user, {'current_only': False}),
    re_path(r'^mission/current/sar/marine/vectors/current/$', views.marine_vectors_all_user, {'current_only': True}),
]
