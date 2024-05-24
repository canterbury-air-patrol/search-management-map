"""
Urls for data

These are linked in at /data/
"""

from django.urls import re_path
from .views import IconIndex, IconView

urlpatterns = [
    re_path(r'^(?P<icon_id>\d+).png$', IconView.as_view()),
    re_path(r'', IconIndex.as_view()),
]
