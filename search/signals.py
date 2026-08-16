"""
Signal handlers that connect asset commands to searches

The mission app can't import search directly (search.models -> data.models
-> mission.models is a cycle), so the search app listens for the commands
it cares about instead.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from mission.models import AssetCommand

from .view_helpers import abandon_inprogress_search


@receiver(post_save, sender=AssetCommand, dispatch_uid='search_release_on_abandon')
def release_search_on_abandon(sender, instance, created, **kwargs):
    """
    Release the asset's in-progress search when it is told to abandon it

    Hooking the command rather than the view means every path that issues
    'AS' - the map action, the asset command dialog, a shell - releases the
    search, so the command and the release can't diverge.
    """
    # pylint: disable=W0613
    if created and instance.command == 'AS' and instance.mission is not None:
        abandon_inprogress_search(instance.mission, instance.asset, instance.issued_by)
