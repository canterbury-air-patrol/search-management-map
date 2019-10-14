"""
Function decorators to make dealing with missions easier
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden
from django.core.exceptions import ObjectDoesNotExist

from .models import Mission, MissionUser, MissionAsset


def mission_user_get(mission_id, user):
    """
    Get the mission_user for the given mission id and user.
    """
    mission = get_object_or_404(Mission, pk=mission_id)
    mission_user = get_object_or_404(MissionUser, mission=mission, user=user)
    return mission_user


def mission_is_member(view_func):
    """
    Make sure that user is a member of the mission
    """
    def wrapper_is_member(*args, **kwargs):
        mission_user = mission_user_get(kwargs['mission_id'], args[0].user)
        return view_func(*args, mission_user=mission_user, **kwargs)
    return wrapper_is_member


def mission_is_admin(view_func):
    """
    Make sure the user is a member and they have an admin role of the mission
    """
    def wrapper_is_admin(*args, **kwargs):
        mission_user = mission_user_get(kwargs['mission_id'], args[0].user)
        if mission_user.role == 'A':
            return view_func(*args, mission_user=mission_user, **kwargs)
        return HttpResponseForbidden("You are not an admin for this Mission")
    return wrapper_is_admin


def mission_asset_get(asset):
    """
    Get the current MissionAsset object for an asset
    """
    try:
        mission_asset = MissionAsset.objects.get(asset=asset, removed__isnull=True)
    except ObjectDoesNotExist:
        mission_asset = None
    return mission_asset


def mission_asset_get_mission(view_func):
    """
    Find the current mission for the asset and add it to the parameters
    """
    def wrapper_mission(*args, **kwargs):
        mission_asset = mission_asset_get(kwargs['asset'])
        if mission_asset is None:
            return HttpResponseForbidden("This Asset is not currently in a mission")
        return view_func(*args, mission=mission_asset.mission, **kwargs)
    return wrapper_mission
