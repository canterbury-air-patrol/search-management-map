from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^sector/incomplete/$', views.sector_search_incomplete, name='sector_search_incomplete'),
    url(r'^sector/completed/$', views.sector_search_completed, name='sector_search_completed'),
    url(r'^sector/create/$', views.sector_search_create, name='sector_search_create'),
]
