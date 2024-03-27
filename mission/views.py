"""
Mission Create/Management Views.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseRedirect, HttpResponseForbidden
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.csrf import ensure_csrf_cookie

from assets.models import Asset, AssetCommand
from organization.models import OrganizationMember, OrganizationAsset
from timeline.models import TimeLineEntry
from timeline.helpers import timeline_record_create, timeline_record_mission_organization_add, timeline_record_mission_user_add, timeline_record_mission_user_update, timeline_record_mission_asset_add, timeline_record_mission_asset_remove

from .models import Mission, MissionUser, MissionAsset, MissionAssetType, MissionOrganization
from .forms import MissionForm, MissionUserForm, MissionAssetForm, MissionTimeLineEntryForm, MissionOrganizationForm
from .decorators import mission_is_member, mission_is_admin


@login_required
@mission_is_member
def mission_details(request, mission_user):
    """
    Missions details and management.
    """
    data = {
        'mission': mission_user.mission,
        'me': request.user,
        'admin': mission_user.is_admin(),
        'mission_organizations': MissionOrganization.objects.filter(mission=mission_user.mission),
        'mission_assets': MissionAsset.objects.filter(mission=mission_user.mission),
        'mission_users': MissionUser.objects.filter(mission=mission_user.mission),
        'mission_asset_types': MissionAssetType.objects.filter(mission=mission_user.mission),
        'mission_organization_add': MissionOrganizationForm(),
        'mission_user_add': MissionUserForm(),
        'mission_asset_add': MissionAssetForm(user=request.user, mission=mission_user.mission),
    }
    return render(request, 'mission_details.html', data)


@login_required
@mission_is_member
def mission_timeline(request, mission_user):
    """
    Mission timeline, a history of everything that happened during a mission.
    """
    data = {
        'mission': mission_user.mission,
    }
    return render(request, 'mission_timeline.html', data)


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
    user_missions = MissionUser.objects.filter(user=request.user)
    organization_missions = MissionOrganization.objects.filter(organization__in=[organization_member.organization for organization_member in OrganizationMember.user_current(user=request.user)])
    organization_missions = organization_missions.exclude(mission__in=[user_mission.mission for user_mission in user_missions])
    organization_missions = organization_missions.distinct('mission')

    missions = []
    for user_mission in user_missions:
        missions.append(user_mission.mission.as_object(user_mission.is_admin()))
    for organization_mission in organization_missions:
        missions.append(organization_mission.mission.as_object(False))
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
            MissionUser(mission=mission, user=request.user, role='A', creator=request.user).save()
            return redirect(f'/mission/{mission.pk}/details/')

    if form is None:
        form = MissionForm()

    return render(request, 'mission_create.html', {'form': form})


@login_required
@mission_is_member
def mission_timeline_json(request, mission_user):
    """
    Mission timeline, a history of everything that happened during a mission, in json
    """
    timeline_entries = TimeLineEntry.objects.filter(mission=mission_user.mission).order_by('timestamp')

    data = {
        'mission': mission_user.mission.as_object(mission_user.is_admin()),
        'timeline': [timeline_entry.as_object() for timeline_entry in timeline_entries],
    }
    return JsonResponse(data)


@login_required
@mission_is_member
def mission_timeline_add(request, mission_user):
    """
    Add a custom entry to the timeline for a mission.
    """
    form = None
    if request.method == 'POST':
        form = MissionTimeLineEntryForm(request.POST)
        if form.is_valid():
            entry = TimeLineEntry(mission=mission_user.mission, user=request.user, message=form.cleaned_data['message'], timestamp=form.cleaned_data['timestamp'], url=form.cleaned_data['url'], event_type='usr')
            entry.save()
            timeline_record_create(mission_user.mission, request.user, entry)
            return HttpResponseRedirect(f"/mission/{mission_user.mission.pk}/timeline/")

    if form is None:
        form = MissionTimeLineEntryForm()

    return render(request, 'mission_timeline_add.html', {'form': form})


@login_required
@mission_is_admin
def mission_organization_add(request, mission_user):
    """
    Add an Organization to a Mission
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


@login_required
@mission_is_admin
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


@login_required
@mission_is_admin
def mission_user_make_admin(request, mission_user, user_id):
    """
    Make an existing user an admin for this mission.
    """
    # Find the User
    user = get_object_or_404(get_user_model(), pk=user_id)
    # Find the MissionUser
    mission_user_update = get_object_or_404(MissionUser, mission=mission_user.mission, user=user)
    mission_user_update.role = 'A'
    mission_user_update.save()
    timeline_record_mission_user_update(mission_user.mission, request.user, mission_user_update)
    return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/details/')


@login_required
@mission_is_member
def mission_asset_add(request, mission_user):
    """
    Add an Asset to a Mission
    """
    form = None
    if request.method == 'POST':
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

    if form is None:
        form = MissionAssetForm(user=request.user, mission=mission_user.mission)

    return render(request, 'mission_asset_add.html', {'form': form})


@login_required
@mission_is_member
def mission_asset_json(request, mission_user):
    """
    List Assets in a Mission
    """
    assets = MissionAsset.objects.filter(mission=mission_user.mission, removed__isnull=True)
    assets_json = []
    for mission_asset in assets:
        assets_json.append({
            'id': mission_asset.asset.pk,
            'name': mission_asset.asset.name,
            'type_id': mission_asset.asset.asset_type.id,
            'type_name': mission_asset.asset.asset_type.name,
        })
    data = {
        'assets': assets_json,
    }
    return JsonResponse(data)


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
