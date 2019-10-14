"""
Helper functions for recording timeline activities
"""

from .models import TimeLineEntry


def timeline_record_create(mission, user, obj):
    """
    Create a timeline entry for an object being created
    """
    message = "{} Created {} ({}): {}".format(user, type(obj).__name__, obj.pk, str(obj))
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='add', message=message, url=url)
    entry.save()


def timeline_record_delete(mission, user, obj):
    """
    Create a timeline entry for an object being deleted
    """
    message = "{} Deleted {} ({}): {}".format(user, type(obj).__name__, obj.pk, str(obj))
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='del', message=message, url=url)
    entry.save()


def timeline_record_update(mission, user, obj, replaces):
    """
    Create a timeline entry for an object being updated/replaced
    """
    message = "{} Replaced {} ({}) with ({}), was: {}".format(user, type(obj).__name__, replaces.pk, obj.pk, str(replaces))
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='upd', message=message, url=url)
    entry.save()


def timeline_record_search_begin(mission, user, asset, obj):
    """
    Create a timeline entry for an asset starting a search
    """
    message = "{} using {} Began {} ({}): {}".format(user, asset, type(obj).__name__, obj.pk, str(obj))
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='sbg', message=message, url=url)
    entry.save()


def timeline_record_search_finished(mission, user, asset, obj):
    """
    Create a timeline entry for an asset finishing a search
    """
    message = "{} using {} Finished {} ({}): {}".format(user, asset, type(obj).__name__, obj.pk, str(obj))
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='snd', message=message, url=url)
    entry.save()
