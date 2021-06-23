"""
Urls for Marine SAR tools

These are linked at /mission/(id)/sar/marine/
"""
from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/vectors/$', views.marine_vectors, name='marine_vectors'),
    url(r'^mission/(?P<mission_id>\d+)/sar/marine/sac/$', views.marine_sac, name='marine_sac'),
]
