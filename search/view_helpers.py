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
