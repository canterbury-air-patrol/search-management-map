"""
Helpers for view functions.

The functions here should cover the logic associated with making
views work.
"""

from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required

from data.view_helpers import to_geojson
from .models import Search


@login_required
def search_json(request, search_id, object_class):
    """
    Get a search object and return it as geojson
    """
    search = get_object_or_404(object_class, pk=search_id)
    return to_geojson(object_class, [search])


def check_searches_in_progress(mission, asset):
    """
    Check if the specified asset has any searches in progress in the specific mission
    """
    searches = Search.objects.filter(inprogress_by=asset, mission=mission).exclude(completed_at__isnull=False)
    if searches.exists():
        return searches[0]

    return None
