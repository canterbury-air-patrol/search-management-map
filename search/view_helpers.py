"""
Helpers for view functions.

The functions here should cover the logic associated with making
views work.
"""

from .models import Search


def check_searches_in_progress(mission, asset):
    """
    Check if the specified asset has any searches in progress in the specific mission
    """
    searches = Search.objects.filter(inprogress_by=asset, mission=mission).exclude(completed_at__isnull=False)
    return searches[0] if searches.exists() else None


def abandon_inprogress_search(mission, asset, user):
    """
    Release any search this asset has in progress in this mission

    Returns the search that was released, or None if there wasn't one.
    """
    search = check_searches_in_progress(mission, asset)
    if search is not None and search.abandon(asset, user):
        return search
    return None
