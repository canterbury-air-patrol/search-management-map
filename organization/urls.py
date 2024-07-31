from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^organization/$', views.OrganizationView.as_view()),
    re_path(r'^organization/(?P<organization_id>\d+)/$', views.organization_details, name='organization_details'),
    re_path(r'^organization/(?P<organization_id>\d+)/user/(?P<username>.*)/$', views.OrganizationUserView.as_view(), name='organization_user_modify'),
    re_path(r'^organization/(?P<organization_id>\d+)/users/notmember/', views.organization_not_members, name='organization_not_members'),
    re_path(r'^organization/(?P<organization_id>\d+)/assets/$', views.organization_asset_list, name='organization_asset_list'),
    re_path(r'^organization/(?P<organization_id>\d+)/assets/(?P<asset_id>\d+)/$', views.organization_asset_modify, name='organization_asset_modify'),
    re_path(r'^organization/(?P<organization_id>\d+)/radio/operator/$', views.organization_radio_operator, name='organization_radio_operator'),
]
