from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^organization/$', views.organization_list, name='organization_list'),
    re_path(r'^organization/create/$', views.organization_create, name='organization_create'),
    re_path(r'^organization/list/all/$', views.organization_list_all, name='organization_list_all'),
    re_path(r'^organization/list/mine/$', views.organization_list_mine, name='organization_list_mine'),
    re_path(r'^organization/(?P<organization_id>\d+)/$', views.organization_details, name='organization_details'),
    re_path(r'^organization/(?P<organization_id>\d+)/user/(?P<username>.*)/$', views.organization_user_modify, name='organization_user_modify'),
    re_path(r'^organization/(?P<organization_id>\d+)/users/notmember/', views.organization_not_members, name='organization_not_members'),
    re_path(r'^organization/(?P<organization_id>\d+)/assets/$', views.organization_asset_list, name='organization_asset_list'),
    re_path(r'^organization/(?P<organization_id>\d+)/assets/(?P<asset_id>\d+)/$', views.organization_asset_modify, name='organization_asset_modify'),
]
