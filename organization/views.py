from django.http import HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotAllowed, JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404

from assets.decorators import asset_is_owner

from .models import Organization, OrganizationMember, OrganizationAsset
from .decorators import organization_is_admin, organization_assets_admin


@login_required
def organization_create(request):
    """
    Create an organization

    Organizations must have unique names, the creator is automatically an admin
    """
    organization_name = None
    if request.method == 'POST':
        organization_name = request.POST.get('name')
    else:
        return HttpResponseNotAllowed(['POST'])

    if organization_name is None:
        return HttpResponseBadRequest()

    organizations = Organization.objects.filter(name=organization_name)
    if len(organizations) > 0:
        return HttpResponseForbidden()

    organization = Organization(name=organization_name, creator=request.user)
    organization.save()
    OrganizationMember(organization=organization, user=request.user, added_by=request.user, role='A').save()

    return JsonResponse(organization.as_object(request.user))


@login_required
def organization_list_all(request):
    """
    List all of the organizations, that haven't been deleted
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    organizations = Organization.objects.filter(deleted__isnull=True)

    return JsonResponse({'organizations': [org.as_object(request.user) for org in organizations]})


@login_required
def organization_list_mine(request):
    """
    List all of the organizations the current user is a member of
    Ignores organizations that have been deleted
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    organization_memberships = OrganizationMember.objects.filter(organization__deleted__isnull=True, user=request.user)

    return JsonResponse({'organizations': [om.organization.as_object(request.user) for om in organization_memberships]})


@login_required
@organization_is_admin
def organization_user_modify(request, organization_member, username):
    """
    Modify the role/membership of a member
    """
    # Don't allow self-modifying
    if username == request.user.username:
        return HttpResponseForbidden('Self-modification prohibited')

    target_user = get_object_or_404(get_user_model(), username=username)

    if request.method == 'POST':
        # Create/modify the membership
        try:
            om = OrganizationMember.objects.get(organization=organization_member.organization, user=target_user)
        except ObjectDoesNotExist:
            om = OrganizationMember(organization=organization_member.organization, user=target_user, added_by=request.user)
            om.save()
        role = request.POST.get('role')
        if role is not None:
            om.role = role
            om.save()
        return JsonResponse(om.as_object())
    else:
        return HttpResponseNotAllowed(['POST'])


@login_required
def organization_asset_list(request, organization_id):
    """
    Get the list of assets that are currently in this organization
    """
    organization = get_object_or_404(Organization, pk=organization_id, deleted__isnull=True)

    organization_assets = OrganizationAsset.objects.filter(organization=organization, removed__isnull=True)

    return JsonResponse({'assets': [oa.as_object() for oa in organization_assets]})


@login_required
@organization_assets_admin
@asset_is_owner
def organization_asset_modify(request, organization_member, asset):
    """
    Modify the role/membership of an asset
    """
    if request.method == 'POST':
        # Create/modify the membership
        try:
            oa = OrganizationAsset.objects.get(organization=organization_member.organization, asset=asset)
        except ObjectDoesNotExist:
            oa = OrganizationAsset(organization=organization_member.organization, asset=asset, added_by=request.user)
            oa.save()
        return JsonResponse(oa.as_object())
    else:
        return HttpResponseNotAllowed(['POST'])
