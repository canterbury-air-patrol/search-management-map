"""
Function decorators to make dealing with missions easier
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden, Http404
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model

from organization.models import OrganizationMember

from .models import Mission, MissionUser, MissionAsset, MissionOrganization


def mission_user_get(mission_id, user):
    """
    Get the mission_user for the given mission id and user.
    """
    mission = get_object_or_404(Mission, pk=mission_id)
    # Find any direct membership first
    try:
        return MissionUser.objects.get(mission=mission, user=user)
    except ObjectDoesNotExist:
        mission_organizations = MissionOrganization.objects.filter(mission=mission, removed__isnull=True).select_related('organization')

        # Fetch all OrganizationMember entries for the user in these organizations
        organization_ids = mission_organizations.values_list('organization_id', flat=True)
        organization_members = OrganizationMember.objects.filter(
            organization_id__in=organization_ids, user=user, removed__isnull=True
        )

        if organization_members.exists():
            add_orgs = False
            add_users = False

            for mission_org in mission_organizations:
                if mission_org.permissions_organization_add:
                    add_orgs = True
                if mission_org.permissions_user_add:
                    add_users = True
                if add_orgs and add_users:
                    break

            return MissionUser(
                mission=mission,
                user=user,
                permissions_organization_add=add_orgs,
                permissions_user_add=add_users,
            )
    raise Http404("Not Found")


def mission_is_member_no_variable(view_func):
    """
    Make sure that user is a member of the mission
    """
    def wrapper_is_member(*args, **kwargs):
        mission_user_get(kwargs['mission_id'], args[0].user)
        kwargs.pop('mission_id')
        return view_func(*args, **kwargs)
    return wrapper_is_member


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


def mission_can_add_organization(view_func):
    """
    Make sure the user is a member and they have the ability to add an organization to the mission
    """
    def wrapper(*args, **kwargs):
        mission_user = kwargs['mission_user']
        if mission_user.can_add_organization():
            return view_func(*args, **kwargs)
        return HttpResponseForbidden("You do not have permission to add organizations to this mission")
    return wrapper


def mission_can_add_user(view_func):
    """
    Make sure the user is a member and they have the ability to add an user to the mission
    """
    def wrapper(*args, **kwargs):
        mission_user = mission_user_get(kwargs['mission_id'], args[0].user)
        kwargs.pop('mission_id')
        if mission_user.can_add_user():
            return view_func(*args, mission_user=mission_user, **kwargs)
        return HttpResponseForbidden("You do not have permission to add users to this mission")
    return wrapper


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


def get_user_from_id(view_func):
    """
    Convert the user_id field to a user object
    """
    def wrapper(*args, **kwargs):
        user = get_object_or_404(get_user_model(), pk=kwargs['user_id'])
        kwargs.pop('user_id')
        return view_func(*args, user=user, **kwargs)
    return wrapper
