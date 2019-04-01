from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^assettypes/json/$', views.asset_types_list, name='asset_types_list'),
]
