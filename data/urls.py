from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^assets/positions/latest/$', views.assets_position_latest, name='assets_position_latest'),
    url(r'^assets/(?P<asset_name>.*)/position/add/$', views.asset_record_position, name='asset_record_position'),
    url(r'^assets/(?P<asset_name>.*)/position/history/$', views.asset_position_history, name='asset_position_history'),
]
