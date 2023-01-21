"""
Function decorators to make dealing with missions easier
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden, Http404
from django.core.exceptions import ObjectDoesNotExist

from organization.models import OrganizationMember

from .models import Mission, MissionUser, MissionAsset, MissionOrganization


def mission_user_get(mission_id, user):
    """
    Get the mission_user for the given mission id and user.
    """
    mission = get_object_or_404(Mission, pk=mission_id)
    # Find any direct membership first
    try:
        mission_user = MissionUser.objects.get(mission=mission, user=user)
        return mission_user
    except ObjectDoesNotExist:
        organization_member = OrganizationMember.objects.filter(organization__in=[mo.organization for mo in MissionOrganization.objects.filter(mission=mission, removed__isnull=True)], user=user, removed__isnull=True)
        if organization_member:
            return MissionUser(mission=mission, user=user, role='M')
    raise Http404("Not Found")


def mission_is_member(view_func):
    """
    Make sure that user is a member of the mission
    """
    def wrapper_is_member(*args, **kwargs):
        mission_user = mission_user_get(kwargs['mission_id'], args[0].user)
        kwargs.pop('mission_id')
        return view_func(*args, mission_user=mission_user, **kwargs)
    return wrapper_is_member


def mission_is_admin(view_func):
    """
    Make sure the user is a member and they have an admin role of the mission
    """
    def wrapper_is_admin(*args, **kwargs):
        mission_user = mission_user_get(kwargs['mission_id'], args[0].user)
        kwargs.pop('mission_id')
        if mission_user.is_admin():
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
