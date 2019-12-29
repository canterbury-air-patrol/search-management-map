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


def timeline_record_mission_user_add(mission, actioner, user):
    """
    Create a timeline entry for an user being added to a mission
    """
    message = "{} Added {} to Mission {}".format(actioner, user, mission.pk)
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='uad', message=message, url=url)
    entry.save()


def timeline_record_mission_user_update(mission, actioner, mission_user):
    """
    Create a timeline entry for an users role being changed in a mission
    """
    message = "{} Changed {} in Mission {} To {}".format(actioner, mission_user.user, mission.pk, mission_user.user_role_name())
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='uup', message=message, url=url)
    entry.save()


def timeline_record_mission_asset_add(mission, user, asset):
    """
    Create a timeline entry for an asset being added to a mission.
    """
    message = "{} Added Asset {} to Mission {}".format(user, asset, mission.pk)
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='aad', message=message, url=url)
    entry.save()


def timeline_record_mission_asset_remove(mission, user, asset):
    """
    Create a timeline entry for an asset being removed from a mission.
    """
    message = "{} Removed Asset {} from Mission {}".format(user, asset, mission.pk)
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='arm', message=message, url=url)
    entry.save()


def timeline_record_image_priority_changed(mission, user, image):
    """
    Create a timeline entry for an image priority being changed.
    """
    message = "{} Updated Image {} Priority ({}) in Mission {}".format(user, image.pk, "important" if image.priority else "normal", mission.pk)
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='ipc', message=message, url=url)
    entry.save()
