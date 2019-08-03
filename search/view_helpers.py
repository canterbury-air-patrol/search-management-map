"""
Helpers for view functions.

The functions here should cover the logic associated with making
views work.
"""

from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required

from data.view_helpers import to_geojson
from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch, PolygonSearch


@login_required
def search_json(request, search_id, object_class):
    """
    Get a search object and return it as geojson
    """
    search = get_object_or_404(object_class, pk=search_id)
    return to_geojson(object_class, [search])


def search_incomplete(object_class):
    """
    Return the list of incomplete searches of type object_class
    """
    return object_class.objects.exclude(deleted=True).exclude(completed__isnull=False)


def search_completed(object_class):
    """
    Return the list of completed searches of type object_class
    """
    return object_class.objects.exclude(deleted=True).exclude(completed__isnull=True)


def check_searches_in_progress(asset):
    """
    Check if the specified asset has any searches in progress
    """
    for object_class in (SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch, PolygonSearch):
        searches = object_class.objects.filter(inprogress_by=asset).exclude(completed__isnull=False)
        if searches.exists():
            return searches[0]

    return None
