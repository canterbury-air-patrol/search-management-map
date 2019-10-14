"""
Function decorators to make dealing with missions easier
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden

from .models import Mission, MissionUser


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
