from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404

from .models import Organization, OrganizationMember


def organization_member_get(organization_id, user):
    """
    Get the organization_member for the given organization id and user.
    """
    organization = get_object_or_404(Organization, pk=organization_id)
    organization_member = get_object_or_404(OrganizationMember, organization=organization, user=user)
    return organization_member


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
