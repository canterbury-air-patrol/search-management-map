from django.http import HttpResponseBadRequest, HttpResponseForbidden, JsonResponse, HttpResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View

from .decorators import asset_is_owner

from assets.models import Asset
from .models import Organization, OrganizationMember, OrganizationAsset
from .decorators import organization_is_admin, organization_assets_admin, organization_is_radio_operator, get_target_user


def _valid_member_role(role):
    return role in {value for value, _label in OrganizationMember.USER_ROLE}


def _is_last_active_admin(organization_member):
    if organization_member.role != 'A':
        return False
    return OrganizationMember.objects.filter(
        organization=organization_member.organization,
        role='A',
        removed__isnull=True,
    ).count() <= 1


@method_decorator(login_required, name="dispatch")
class OrganizationView(View):
    """
    View for all organizations
    """
    def as_json(self, request):
        """
        Return all this users assets as json
        """
        if request.GET.get('only', '') == 'mine':
            organization_memberships = OrganizationMember.user_current(user=request.user).filter(organization__deleted__isnull=True)
            return JsonResponse({'organizations': [om.organization.as_object(request.user) for om in organization_memberships]})
        organizations = Organization.objects.filter(deleted__isnull=True)
        return JsonResponse({'organizations': [org.as_object(request.user) for org in organizations]})

    def get(self, request):
        """
        Show the organizations list
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request)
        return render(request, 'organization/list.html')

    def post(self, request):
        """
        Create a new organization
        Organizations must have unique names, the creator is automatically an admin
        """
        organization_name = request.POST.get('name')

        if organization_name is None:
            return HttpResponseBadRequest()

        organizations = Organization.objects.filter(name=organization_name)
        if len(organizations) > 0:
            return HttpResponseForbidden()

        organization = Organization(name=organization_name, creator=request.user)
        organization.save()
        OrganizationMember(organization=organization, user=request.user, added_by=request.user, role='A').save()

        return JsonResponse(organization.as_object(request.user))


@method_decorator(login_required, name="dispatch")
class OrganizationDetailView(View):
    def get(self, request, organization_id):
        organization = get_object_or_404(Organization, pk=organization_id)
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            organization_data = organization.as_object(request.user)
            organization_assets = OrganizationAsset.objects.filter(organization=organization, removed__isnull=True)
            organization_data['assets'] = [oa.as_object(org=False) for oa in organization_assets]
            organization_members = OrganizationMember.objects.filter(organization=organization, removed__isnull=True)
            organization_data['members'] = [om.as_object(org=False) for om in organization_members]
            return JsonResponse(organization_data)
        return render(request, 'organization/details.html', {'organization': organization})


@method_decorator(login_required, name="dispatch")
@method_decorator(get_target_user, name="dispatch")
@method_decorator(organization_is_admin, name="dispatch")
class OrganizationUserView(View):
    """
    View/Control the role of a user in this organization
    """
    def as_json(self, request, om):
        return JsonResponse(om.as_object(request.user))

    def get(self, request, organization_member, target_user):
        om = get_object_or_404(OrganizationMember, organization=organization_member.organization, user=target_user, removed__isnull=True)
        return self.as_json(request, om)

    def post(self, request, organization_member, target_user):
        # Create/modify the membership
        role = request.POST.get('role')
        if role is not None and not _valid_member_role(role):
            return HttpResponseBadRequest("Invalid organization role")

        try:
            om = OrganizationMember.objects.get(organization=organization_member.organization, user=target_user, removed__isnull=True)
        except ObjectDoesNotExist:
            om = OrganizationMember(organization=organization_member.organization, user=target_user, added_by=request.user)
            om.save()
        if role is not None:
            if role != 'A' and _is_last_active_admin(om):
                return HttpResponseForbidden("Cannot remove the last organization admin")
            om.role = role
            om.save()
        return JsonResponse(om.as_object(request.user))

    def delete(self, request, organization_member, target_user):
        om = get_object_or_404(OrganizationMember, organization=organization_member.organization, user=target_user, removed__isnull=True)
        if _is_last_active_admin(om):
            return HttpResponseForbidden("Cannot remove the last organization admin")
        om.removed = timezone.now()
        om.removed_by = organization_member.user
        om.save()
        return HttpResponse('')


@method_decorator(login_required, name='dispatch')
class OrganizationAssetsView(View):
    """
    All assets visible to the current user via their org memberships.
    """
    def get(self, request):
        """Return assets from all orgs where the user has a recorder/operator/admin role."""
        org_ids = OrganizationMember.objects.filter(
            user=request.user, role__in=['A', 'R', 'b'], removed__isnull=True
        ).values_list('organization', flat=True)
        asset_ids = OrganizationAsset.objects.filter(
            organization__in=org_ids,
            removed__isnull=True,
        ).values_list('asset', flat=True)
        assets = Asset.objects.filter(pk__in=asset_ids).order_by('name')
        return JsonResponse({'assets': [a.as_object() for a in assets]})


@login_required
def organization_asset_list(request, organization_id):
    """
    Get the list of assets that are currently in this organization
    """
    organization = get_object_or_404(Organization, pk=organization_id, deleted__isnull=True)

    organization_assets = OrganizationAsset.objects.filter(organization=organization, removed__isnull=True)

    return JsonResponse({'assets': [oa.as_object() for oa in organization_assets]})


@method_decorator(login_required, name="dispatch")
@method_decorator(organization_assets_admin, name="dispatch")
@method_decorator(asset_is_owner, name="dispatch")
class OrganizationAssetView(View):
    def post(self, request, organization_member, asset):
        try:
            oa = OrganizationAsset.objects.get(organization=organization_member.organization, asset=asset)
        except ObjectDoesNotExist:
            oa = OrganizationAsset(organization=organization_member.organization, asset=asset, added_by=request.user)
            oa.save()
        return JsonResponse(oa.as_object())

    def delete(self, request, organization_member, asset):
        oa = get_object_or_404(OrganizationAsset, organization=organization_member.organization, asset=asset, removed__isnull=True)
        oa.removed = timezone.now()
        oa.removed_by = request.user
        oa.save()
        return HttpResponse('')


@login_required
@organization_is_admin
def organization_not_members(request, organization_member):
    """
    Get all users who aren't currently in this organization
    """
    users = get_user_model().objects.exclude(pk__in=[OrganizationMember.objects.filter(removed__isnull=True, organization=organization_member.organization).values_list('user')])
    return JsonResponse({
        'users': [{'username': user.username, 'id': user.pk} for user in users]
    })


@login_required
@organization_is_radio_operator
def organization_radio_operator(request, organization_member):
    """
    Present the Radio Operator screen
    """
    return render(request, 'organization/radio-operator.html', {'organization': organization_member.organization})
