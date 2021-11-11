"""
Urls for Marine SAR tools

These are linked at /mission/(id)/sar/marine/
"""
from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/$', views.marine_vectors, name='marine_vectors'),
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/create/$', views.marine_vectors_create, name='marine_vectors_create'),
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/(?P<tdv_id>\d+)/delete/$', views.marine_vectors_delete, name='marine_vectors_delete'),
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/current/$', views.marine_vectors_all, name='marine_vectors_all'),
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/sac/$', views.marine_sac, name='marine_sac'),

    url(r'^mission/all/sar/marine/vectors/current/$', views.marine_vectors_all_user, {'current_only': False}),
    url(r'^mission/current/sar/marine/vectors/current/$', views.marine_vectors_all_user, {'current_only': True}),
]
