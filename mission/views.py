"""
Mission Create/Management Views.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, JsonResponse, HttpResponseRedirect, HttpResponseForbidden, HttpResponseNotFound, HttpResponse
from django.db import transaction
from django.db.models import OuterRef, Subquery
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie

from assets.models import Asset, AssetCommand
from assets.decorators import asset_is_operator
from organization.decorators import get_organization_from_id
from organization.models import OrganizationMember, OrganizationAsset
from timeline.models import TimeLineEntry
from timeline.helpers import timeline_record_create, timeline_record_mission_organization_add, timeline_record_mission_organization_update, timeline_record_mission_user_add, \
    timeline_record_mission_user_update, timeline_record_mission_asset_add, timeline_record_mission_asset_remove, timeline_record_mission_asset_status

from .models import Mission, MissionUser, MissionAsset, MissionAssetType, MissionOrganization, MissionAssetStatus, MissionAssetStatusValue
from .forms import MissionForm, MissionUserForm, MissionAssetForm, MissionOrganizationForm
from .decorators import get_user_from_id, mission_can_add_organization, mission_can_add_user, mission_is_member, mission_is_admin


@login_required
@mission_is_member
def mission_details(request, mission_user):
    """
    Missions details and management.
    """
    latest_status_subquery = MissionAssetStatus.objects.filter(mission_asset=OuterRef('pk')).order_by('-since').values('status__name')[:1]
    latest_since_subquery = MissionAssetStatus.objects.filter(mission_asset=OuterRef('pk')).order_by('-since').values('since')[:1]
    mission_assets = MissionAsset.objects.filter(mission=mission_user.mission).annotate(status=Subquery(latest_status_subquery), status_since=Subquery(latest_since_subquery))
    data = {
        'mission': mission_user.mission,
        'me': request.user,
        'admin': mission_user.is_admin(),
        'can_add_organizations': mission_user.can_add_organization(),
        'can_add_users': mission_user.can_add_user(),
        'mission_organizations': MissionOrganization.objects.filter(mission=mission_user.mission),
        'mission_assets': mission_assets,
        'mission_users': MissionUser.objects.filter(mission=mission_user.mission),
        'mission_asset_types': MissionAssetType.objects.filter(mission=mission_user.mission),
        'mission_organization_add': MissionOrganizationForm(),
        'mission_user_add': MissionUserForm(),
        'mission_asset_add': MissionAssetForm(user=request.user, mission=mission_user.mission),
    }
    return render(request, 'mission_details.html', data)


@login_required
@mission_is_admin
def mission_close(request, mission_user):
    """
    Close a Mission
    """
    if mission_user.mission.closed is not None:
        if url_has_allowed_host_and_scheme(request.META.get('HTTP_REFERER'), settings.ALLOWED_HOSTS):
            return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
        return redirect('/')

    mission_user.mission.closed = timezone.now()
    mission_user.mission.closed_by = request.user
    mission_user.mission.save()

    # Tell all the assets, and free them from this mission
    assets = MissionAsset.objects.filter(mission=mission_user.mission, removed__isnull=True)
    for mission_asset in assets:
        command = AssetCommand(asset=mission_asset.asset, issued_by=mission_user.user, command='MC', reason='The Mission was Closed', mission=mission_user.mission)
        command.save()
        mission_asset.remover = request.user
        mission_asset.removed = timezone.now()
        mission_asset.save()
        timeline_record_mission_asset_remove(mission_user.mission, request.user, asset=mission_asset.asset)

    if url_has_allowed_host_and_scheme(request.META.get('HTTP_REFERER'), settings.ALLOWED_HOSTS):
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    return redirect('/')


@login_required
@ensure_csrf_cookie
def mission_list(request):
    """
    List missions this user can select from.
    """
    return render(request, 'mission_list.html')


@login_required
def mission_list_data(request):
    """
    Provide data for all the missions this user is a member of
    """
    exclude_closed = False
    exclude_open = False
    if request.method == 'GET':
        only = request.GET.get('only', '')
        if only == 'active':
            exclude_closed = True
        elif only == 'closed':
            exclude_open = True

    user_missions = MissionUser.objects.filter(user=request.user)
    organization_missions = MissionOrganization.objects.filter(organization__in=[organization_member.organization for organization_member in OrganizationMember.user_current(user=request.user)])
    organization_missions = organization_missions.exclude(mission__in=[user_mission.mission for user_mission in user_missions])
    organization_missions = organization_missions.distinct('mission')
    if exclude_closed:
        organization_missions = organization_missions.exclude(mission__closed__isnull=False)
        user_missions = user_missions.exclude(mission__closed__isnull=False)
    if exclude_open:
        organization_missions = organization_missions.exclude(mission__closed__isnull=True)
        user_missions = user_missions.exclude(mission__closed__isnull=True)

    missions = [
        user_mission.mission.as_object(user_mission.is_admin())
        for user_mission in user_missions
    ]
    missions.extend(
        organization_mission.mission.as_object(False)
        for organization_mission in organization_missions
    )
    data = {
        'missions': missions,
    }
    return JsonResponse(data)


@login_required
def mission_new(request):
    """
    Create a new mission.
    """
    form = None
    if request.method == 'POST':
        form = MissionForm(request.POST)
        if form.is_valid():
            # Create the new mission
            mission = Mission(mission_name=form.cleaned_data['mission_name'], mission_description=form.cleaned_data['mission_description'], creator=request.user)
            mission.save()
            # Give the user who created this mission admin permissions
            MissionUser(mission=mission, user=request.user, permissions_admin=True, creator=request.user).save()
            return redirect(f'/mission/{mission.pk}/details/')

    if form is None:
        form = MissionForm()

    return render(request, 'mission_create.html', {'form': form})


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MissionTimelineView(View):
    """
    Show/update the timeline for a mission
    """
    def as_json(self, mission_user):
        """
        Mission timeline, a history of everything that happened during a mission, in json
        """
        timeline_entries = TimeLineEntry.objects.filter(mission=mission_user.mission).order_by('timestamp')

        data = {
            'mission': mission_user.mission.as_object(mission_user.is_admin()),
            'timeline': [timeline_entry.as_object() for timeline_entry in timeline_entries],
        }
        return JsonResponse(data)

    def get(self, request, mission_user):
        """
        Display the assets in this mission
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(mission_user)
        data = {
            'mission': mission_user.mission,
        }
        return render(request, 'mission_timeline.html', data)

    def post(self, request, mission_user):
        """
        Add a custom entry to the mission timeline
        """
        message = request.POST.get('message')
        url = request.POST.get('url')
        timestamp = request.POST.get('timestamp')
        if message:
            entry = TimeLineEntry(mission=mission_user.mission, user=request.user, message=message, timestamp=timestamp, url=url, event_type='usr')
            entry.save()
            timeline_record_create(mission_user.mission, request.user, entry)
            return HttpResponse("Done")
        return HttpResponse("Failed")


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
@method_decorator(mission_can_add_organization, name="post")
class MissionOrganizationsView(View):
    """
    Show and add organizations to the mission
    """
    def as_json(self, mission) -> JsonResponse:
        """
        Mission Organizations as json
        """
        mission_orgs = [mo.as_json() for mo in MissionOrganization.objects.filter(mission=mission, removed__isnull=True)]
        return JsonResponse(data={
            'organizations': mission_orgs
        })

    def get(self, request, mission_user):
        """
        Get a list of the organizations in this mission
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(mission_user.mission)
        return render(request, 'mission_organizations_list.html')

    def post(self, request, mission_user):
        """
        Add an organization to this mission
        """
        form = None
        if request.method == 'POST':
            form = MissionOrganizationForm(request.POST)
            if form.is_valid():
                # Check if this organization is already in this mission
                try:
                    MissionOrganization.objects.get(organization=form.cleaned_data['organization'], mission=mission_user.mission)
                    return HttpResponseForbidden("Organization is already in this Mission")
                except ObjectDoesNotExist:
                    # Create the new mission<->organization
                    mission_user = MissionOrganization(mission=mission_user.mission, organization=form.cleaned_data['organization'], creator=request.user)
                    mission_user.save()
                    timeline_record_mission_organization_add(mission_user.mission, request.user, form.cleaned_data['organization'])
                    return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')

        if form is None:
            form = MissionUserForm()

        return render(request, 'mission_user_add.html', {'form': form})


@method_decorator(login_required, name="dispatch")
@method_decorator(get_organization_from_id, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MissionOrganizationView(View):
    """
    Show and adjust the permissions of a organization in the mission
    """
    def as_json(self, mission_organization):
        """
        Mission Organization details, in json
        """
        return JsonResponse(mission_organization.as_json())

    def get(self, request, mission_user, organization):
        """
        Display the details of this organization in this mission
        """
        mission_organization = get_object_or_404(MissionOrganization, mission=mission_user.mission, organization=organization)
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(mission_organization)
        data = {
            'current_user': mission_user,
            'organization': mission_organization,
        }
        return render(request, 'mission_organization_details.html', data)

    def _set_organization_permissions(self, mission_user, mission_organization, permission_type, value):
        """
        Set mission organizations permissions
        """
        setattr(mission_organization, f'permissions_{permission_type}', value)
        timeline_record_mission_organization_update(mission_user.mission, mission_user.user, mission_organization.organization, permission_type, value)

    def post(self, request, mission_user, organization):
        """
        Update the permissions of an organization
        """
        if not mission_user.is_admin():
            return HttpResponseForbidden("Not an admin")
        add_organization = request.POST.get('add_organization', None)
        add_user = request.POST.get('add_user', None)

        if add_organization is not None and add_organization.lower() not in ["true", "false"]:
            return HttpResponseBadRequest()
        if add_user is not None and add_user.lower() not in ["true", "false"]:
            return HttpResponseBadRequest()

        if add_organization is not None or add_user is not None:
            with transaction.atomic():
                mission_organization = get_object_or_404(MissionOrganization, mission=mission_user.mission, organization=organization)
                if add_organization is not None:
                    self._set_organization_permissions(mission_user, mission_organization, 'organization_add', add_organization.lower() == "true")
                if add_user is not None:
                    self._set_organization_permissions(mission_user, mission_organization, 'user_add', add_user.lower() == "true")
                mission_organization.save()
        return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')


@login_required
@mission_can_add_user
def mission_user_add(request, mission_user):
    """
    Add a User to a Mission
    """
    form = None
    if request.method == 'POST':
        form = MissionUserForm(request.POST)
        if form.is_valid():
            # Check if this user is already in this mission
            try:
                mission_user = MissionUser.objects.get(user=form.cleaned_data['user'], mission=mission_user.mission)
                return HttpResponseForbidden("User is already in this Mission")
            except ObjectDoesNotExist:
                # Create the new mission<->user
                mission_user = MissionUser(mission=mission_user.mission, user=form.cleaned_data['user'], creator=request.user)
                mission_user.save()
                timeline_record_mission_user_add(mission_user.mission, request.user, form.cleaned_data['user'])
                return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')

    if form is None:
        form = MissionUserForm()

    return render(request, 'mission_user_add.html', {'form': form})


@method_decorator(login_required, name="dispatch")
@method_decorator(get_user_from_id, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MissionUserView(View):
    """
    Show and adjust the permissions of a user in the mission
    """
    def as_json(self, target_mission_user):
        """
        Mission User details, in json
        """
        return JsonResponse(target_mission_user.as_json())

    def get(self, request, mission_user, user):
        """
        Display the details of this user in this mission
        """
        target_mission_user = get_object_or_404(MissionUser, mission=mission_user.mission, user=user)
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(target_mission_user)
        data = {
            'current_user': mission_user,
            'target_user': target_mission_user,
        }
        return render(request, 'mission_user_details.html', data)

    def _update_user_permissions(self, mission_user, target_mission_user, permission_type, value):
        """
        Set the permission (permission_type) on the mission user
        """
        setattr(target_mission_user, f"permissions_{permission_type}", value)
        timeline_record_mission_user_update(mission_user.mission, mission_user.user, target_mission_user, permission_type, value)

    def post(self, request, mission_user, user):
        """
        Update the permissions of a user
        """
        if not mission_user.is_admin():
            return HttpResponseForbidden("Not an admin")
        if mission_user.user == user:
            return HttpResponseForbidden("Cannot modify yourself")
        admin = request.POST.get('admin', None)
        add_organization = request.POST.get('add_organization', None)
        add_user = request.POST.get('add_user', None)

        if admin is not None or add_organization is not None or add_user is not None:
            target_mission_user = get_object_or_404(MissionUser, mission=mission_user.mission, user=user)
            if admin is not None:
                self._update_user_permissions(mission_user, target_mission_user, 'admin', admin.lower() == "true")
            if add_organization is not None:
                self._update_user_permissions(mission_user, target_mission_user, 'organization_add', add_organization.lower() == "true")
            if add_user is not None:
                self._update_user_permissions(mission_user, target_mission_user, 'user_add', add_user.lower() == "true")
            target_mission_user.save()
        return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class MissionAssetsView(View):
    """
    View to manage assets in the mission
    """
    def as_json(self, request, mission_user):
        """
        Get the assets in this mission as json list
        """
        if request.GET.get('include_removed', False):
            assets = MissionAsset.objects.filter(mission=mission_user.mission)
        else:
            assets = MissionAsset.objects.filter(mission=mission_user.mission, removed__isnull=True)
        assets_json = []
        for mission_asset in assets:
            asset_data = {
                'id': mission_asset.asset.pk,
                'name': mission_asset.asset.name,
                'type_id': mission_asset.asset.asset_type.id,
                'type_name': mission_asset.asset.asset_type.name,
                'icon_url': mission_asset.asset.icon_url(),
            }
            if asset_status := MissionAssetStatus.current_for_asset(mission_asset):
                asset_data['status'] = asset_status.as_object()
            assets_json.append(asset_data)

        data = {
            'assets': assets_json,
        }
        return JsonResponse(data)

    def get(self, request, mission_user):
        """
        Display the assets in this mission
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request, mission_user)
        return render(request, "mission/assets_view.html")

    def post(self, request, mission_user):
        """
        Add an asset to this mission
        """
        form = None
        form = MissionAssetForm(request.POST, user=request.user, mission=mission_user.mission)
        if form.is_valid():
            # Check if this asset is in any other missions currently
            if MissionAsset.objects.filter(asset=form.cleaned_data['asset'], removed__isnull=True).exists():
                return HttpResponseForbidden("Asset is already in another Mission")
            # Create the new mission<->asset
            mission_asset = MissionAsset(mission=mission_user.mission, asset=form.cleaned_data['asset'], creator=request.user)
            mission_asset.save()
            timeline_record_mission_asset_add(mission_user.mission, request.user, asset=form.cleaned_data['asset'])
            command = AssetCommand(asset=mission_asset.asset, issued_by=mission_user.user, command='RON', reason='Added to mission', mission=mission_user.mission)
            command.save()

            return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')
        return HttpResponseNotFound()


def mission_asset_is_owner(mission_user, asset, user):
    """
    Is this user allowed to act on this asset in this mission?
    """
    if mission_user.is_admin():
        return True

    if asset.owner == user:
        return True

    om_list = OrganizationMember.user_current(user=user)
    if len(om_list) > 0:
        orgs_list = [organization_member.organization for organization_member in om_list]
        if len(OrganizationAsset.objects.filter(asset=asset, organization__in=orgs_list).values_list('organization')) > 0:
            return True

    return False


@login_required
@mission_is_member
def mission_asset_remove(request, mission_user, asset_id):
    """
    Cease using an asset as part of this Mission
    """
    asset = get_object_or_404(Asset, pk=asset_id)
    mission_asset = get_object_or_404(MissionAsset, mission=mission_user.mission, asset=asset, removed__isnull=True)

    if not mission_asset_is_owner(mission_user, asset, request.user):
        return HttpResponseForbidden('Only assets owners or a mission admin can remove assets')
    mission_asset.remover = request.user
    mission_asset.removed = timezone.now()
    mission_asset.save()

    timeline_record_mission_asset_remove(mission_user.mission, request.user, asset=asset)

    # Tell the asset
    command = AssetCommand(asset=mission_asset.asset, issued_by=mission_user.user, command='MC', reason='Removed from Mission', mission=mission_user.mission)
    command.save()

    return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
@method_decorator(asset_is_operator, name="post")
class MissionAssetStatusView(View):
    """
    View the asset status in this mission
    """
    def as_json(self, request, mission_asset):
        """
        Return the current status as json
        """
        asset_status = MissionAssetStatus.current_for_asset(mission_asset)
        if asset_status is None:
            return HttpResponseNotFound()
        data = {
            'status': asset_status.as_object(),
        }
        return JsonResponse(data)

    def get(self, request, mission_user, asset_id):
        """
        Get the current asset status
        """
        asset = get_object_or_404(Asset, pk=asset_id)
        mission_asset = get_object_or_404(MissionAsset, mission=mission_user.mission, asset=asset, removed__isnull=True)
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request, mission_asset)
        return render(request, "mission_asset_status.html", {'mission_asset': mission_asset})

    def post(self, request, mission_user, asset):
        """
        Allow setting/updating the asset status
        """
        mission_asset = get_object_or_404(MissionAsset, mission=mission_user.mission, asset=asset, removed__isnull=True)
        value_id = request.POST.get('value_id')
        notes = request.POST.get('notes')
        status_value = get_object_or_404(MissionAssetStatusValue, pk=value_id)
        asset_status = MissionAssetStatus.objects.create(mission_asset=mission_asset, status=status_value, notes=notes)
        timeline_record_mission_asset_status(mission_user.mission, user=request.user, asset=asset, status=status_value)
        return JsonResponse({'status': asset_status.as_object()})


@method_decorator(login_required, name="dispatch")
class MissionAssetStatusValuesView(View):
    """
    View of possible mission asset status values
    """
    def as_json(self, request):
        """
        Return all possible asset status values as json
        """
        data = {
            'values': [v.as_object() for v in MissionAssetStatusValue.objects.all()],
        }
        return JsonResponse(data)

    def get(self, request):
        """
        Get the asset status values
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request)
        return render(request, "mission_asset_status_value.html")
