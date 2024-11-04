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


def timeline_record_mission_organization_update(mission, actioner, organization, permission, value):
    """
    Create a timeline entry for an organization permission(s) being changed in a mission
    """
    action = "Granted" if value else "Removed"
    direction = "to" if value else "from"
    message = f"{actioner} {action} {permission} {direction} {organization} in Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='oup', message=message, url=url)
    entry.save()


def timeline_record_mission_user_add(mission, actioner, user):
    """
    Create a timeline entry for an user being added to a mission
    """
    message = f"{actioner} Added {user} to Mission {mission.pk}"
    url = ""
    entry = TimeLineEntry(mission=mission, user=actioner, event_type='uad', message=message, url=url)
    entry.save()


def timeline_record_mission_user_update(mission, actioner, mission_user, permission, value):
    """
    Create a timeline entry for an users permission(s) being changed in a mission
    """
    action = "Granted" if value else "Removed"
    direction = "to" if value else "from"
    message = f"{actioner} {action} {permission} {direction} {mission_user.user} in Mission {mission.pk}"
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


def timeline_record_mission_asset_status(mission, user, asset, status):
    """
    Create a timeline entry for a mission asset status being set
    """
    message = f"{user} set the status for {asset} in mission {mission.pk} to {status}"
    entry = TimeLineEntry(mission=mission, user=user, event_type='mas', message=message, url="")
    entry.save()


def timeline_record_asset_command_sent(mission, user, asset, command, text, geo):
    """
    Create a timeline entry for sending a command to an asset
    """
    # pylint: disable=R0913,R0917
    message = f"{user} sent {asset} in mission {mission.pk}: {command}, with message {text}"
    if geo is not None:
        message = f"{message} ({geo})"
    entry = TimeLineEntry(mission=mission, user=user, event_type='acs', message=message, url="")
    entry.save()


def timeline_record_asset_command_response(mission, user, asset, command, response_type, response_message):
    """
    Create a timeline entry when an asset responds to a command
    """
    # pylint: disable=R0913,R0917
    message = f"{asset} (by {user}) in mission {mission.pk} replied to {command} with {response_type}: {response_message}"
    entry = TimeLineEntry(mission=mission, user=user, event_type='acr', message=message, url="")
    entry.save()
