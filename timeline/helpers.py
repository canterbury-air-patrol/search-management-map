"""
Helper functions for recording timeline activities
"""

from .models import TimeLineEntry


def timeline_record_create(mission, user, obj):
    """
    Create a timeline entry for an object being created
    """
    message = f"{user} Created {type(obj).__name__} ({obj.pk}): {str(obj)}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='add', message=message, url=url)
    entry.save()


def timeline_record_delete(mission, user, obj):
    """
    Create a timeline entry for an object being deleted
    """
    message = f"{user} Deleted {type(obj).__name__} ({obj.pk}): {str(obj)}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='del', message=message, url=url)
    entry.save()


def timeline_record_update(mission, user, obj, replaces):
    """
    Create a timeline entry for an object being updated/replaced
    """
    message = f"{user} Replaced {type(obj).__name__} ({replaces.pk}) with ({obj.pk}), was: {str(replaces)}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='upd', message=message, url=url)
    entry.save()


def timeline_record_search_begin(mission, user, asset, obj):
    """
    Create a timeline entry for an asset starting a search
    """
    message = f"{user} using {asset} Began {type(obj).__name__} ({obj.pk}): {str(obj)}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='sbg', message=message, url=url)
    entry.save()


def timeline_record_search_finished(mission, user, asset, obj):
    """
    Create a timeline entry for an asset finishing a search
    """
    message = f"{user} using {asset} Finished {type(obj).__name__} ({obj.pk}): {str(obj)}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='snd', message=message, url=url)
    entry.save()


def timeline_record_mission_organization_add(mission, actioner, organization):
    """
    Create a timeline entry for an organization being added to a mission
    """
    message = f"{actioner} Added {organization} to Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='oad', message=message, url=url)
    entry.save()


def timeline_record_mission_user_add(mission, actioner, user):
    """
    Create a timeline entry for an user being added to a mission
    """
    message = f"{actioner} Added {user} to Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='uad', message=message, url=url)
    entry.save()


def timeline_record_mission_user_update(mission, actioner, mission_user):
    """
    Create a timeline entry for an users role being changed in a mission
    """
    message = f"{actioner} Changed {mission_user.user} in Mission {mission.pk} To {mission_user.user_role_name()}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='uup', message=message, url=url)
    entry.save()


def timeline_record_mission_asset_add(mission, user, asset):
    """
    Create a timeline entry for an asset being added to a mission.
    """
    message = f"{user} Added Asset {asset} to Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='aad', message=message, url=url)
    entry.save()


def timeline_record_mission_asset_remove(mission, user, asset):
    """
    Create a timeline entry for an asset being removed from a mission.
    """
    message = f"{user} Removed Asset {asset} from Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='arm', message=message, url=url)
    entry.save()


def timeline_record_image_priority_changed(mission, user, image):
    """
    Create a timeline entry for an image priority being changed.
    """
    message = f'{user} Updated Image {image.pk} Priority ({"important" if image.priority else "normal"}) in Mission {mission.pk}'
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='ipc', message=message, url=url)
    entry.save()


def timeline_record_search_queue(mission, user, search, assettype, asset):
    """
    Create a timeline entry for a search being queued
    """
    if asset:
        message = f"{user} Queued Search {search} for Asset {asset} in Mission {mission.pk}"
    else:
        message = f"{user} Queued Search {search} for Assets of Type {assettype} in Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=user, event_type='que', message=message, url=url)
    entry.save()
