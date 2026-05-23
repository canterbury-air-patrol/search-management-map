from functools import wraps

from django.contrib.auth import get_user_model
from django.http import HttpResponseForbidden, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404

from assets.models import Asset

from .helpers import organization_user_is_asset_recorder, organization_user_is_asset_radio_operator
from .models import Organization, OrganizationMember


def organization_member_get(organization_id, user):
    """
    Get the organization_member for the given organization id and user.
    """
    organization = get_object_or_404(Organization, pk=organization_id)
    return get_object_or_404(
        OrganizationMember,
        organization=organization,
        user=user,
        removed__isnull=True,
    )


def organization_is_admin(view_func):
    """
    Make sure the user is a member and they have an admin role of the organization
    """
    def wrapper_is_admin(*args, **kwargs):
        organization_member = organization_member_get(kwargs['organization_id'], args[0].user)
        kwargs.pop('organization_id')
        if organization_member.is_admin():
            return view_func(*args, organization_member=organization_member, **kwargs)
        return HttpResponseForbidden("You are not an admin for this Organization")
    return wrapper_is_admin


def organization_assets_admin(view_func):
    """
    Make sure the user is a member and they are allowed to admin assets in this organization
    """
    def wrapper_is_asset_admin(*args, **kwargs):
        organization_member = organization_member_get(kwargs['organization_id'], args[0].user)
        kwargs.pop('organization_id')
        if organization_member.is_asset_admin():
            return view_func(*args, organization_member=organization_member, **kwargs)
        return HttpResponseForbidden("You are not allowed to modify assets to this Organization")
    return wrapper_is_asset_admin


def organization_is_radio_operator(view_func):
    """
    Make sure the user is a member and they are have the radio operator or admin role
    """
    def wrapper_is_radio_operator(*args, **kwargs):
        organization_member = organization_member_get(kwargs['organization_id'], args[0].user)
        kwargs.pop('organization_id')
        if organization_member.is_radio_operator():
            return view_func(*args, organization_member=organization_member, **kwargs)
        return HttpResponseForbidden("You are not a radio operator for this organization")
    return wrapper_is_radio_operator


def get_target_user(view_func):
    """
    Convert a username into a user object
    """
    def wrapper_get_target_user(*args, **kwargs):
        target_user = get_object_or_404(get_user_model(), username=kwargs['username'])
        kwargs.pop('username')
        return view_func(*args, target_user=target_user, **kwargs)
    return wrapper_get_target_user


def user_can_operate_asset(user, asset):
    return asset.owner == user or organization_user_is_asset_radio_operator(user, asset)


def asset_permission_required(check_fn, error_message):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            asset = get_object_or_404(Asset, pk=kwargs['asset_id'])
            if not check_fn(request.user, asset):
                return HttpResponseForbidden(error_message)
            kwargs.pop('asset_id')
            return view_func(request, *args, asset=asset, **kwargs)
        return wrapper
    return decorator


def asset_is_recorder(view_func):
    """
    Make sure the current user is allowed to record (positions) for this asset.
    """
    return asset_permission_required(
        lambda user, asset: asset.owner == user or organization_user_is_asset_recorder(user, asset),
        "Not Authorized to record the position of this asset",
    )(view_func)


def asset_is_operator(view_func):
    """
    Make sure the current user is allowed to act on behalf of this asset.
    """
    return asset_permission_required(
        user_can_operate_asset,
        "Not Authorized to act on behalf of this asset",
    )(view_func)


def asset_is_owner(view_func):
    """
    Make sure the current user is the owner of this asset.
    """
    return asset_permission_required(
        lambda user, asset: asset.owner == user,
        "Not Authorized, this is not your asset",
    )(view_func)


def asset_id_in_get_post(view_func):
    """
    Make sure the asset_id in the GET/POST is a valid asset and this user can act as them.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.method == 'GET':
            asset_id = request.GET.get('asset_id')
        elif request.method == 'POST':
            asset_id = request.POST.get('asset_id')
        else:
            return HttpResponseNotAllowed(['GET', 'POST'])
        asset = get_object_or_404(Asset, pk=asset_id)
        if not user_can_operate_asset(request.user, asset):
            return HttpResponseForbidden("Wrong User for Asset")
        return view_func(request, *args, asset=asset, **kwargs)
    return wrapper


def get_organization_from_id(view_func):
    """
    Convert an organization id into an organization object
    """
    def wrapper(*args, **kwargs):
        organization = get_object_or_404(Organization, pk=kwargs['organization_id'])
        kwargs.pop('organization_id')
        return view_func(*args, organization=organization, **kwargs)
    return wrapper
