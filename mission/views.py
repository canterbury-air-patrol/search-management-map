"""
Mission Create/Management Views.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, HttpResponseForbidden
from django.utils import timezone

from assets.models import Asset
from timeline.models import TimeLineEntry

from .models import Mission, MissionUser, MissionAsset, MissionAssetType
from .forms import MissionForm, MissionAssetForm
from .decorators import mission_is_member, mission_is_admin


@login_required
@mission_is_member
def mission_details(request, mission_id, mission_user=None):
    """
    Missions details and management.
    """
    data = {
        'mission': mission_user.mission,
        'me': request.user,
        'admin': mission_user.role == 'A',
        'mission_assets': MissionAsset.objects.filter(mission=mission_user.mission),
        'mission_users': MissionUser.objects.filter(mission=mission_user.mission),
        'mission_asset_types': MissionAssetType.objects.filter(mission=mission_user.mission),
    }
    return render(request, 'mission_details.html', data)


@login_required
@mission_is_member
def mission_timeline(request, mission_id, mission_user):
    """
    Mission timeline, a history of everything that happened during a mission.
    """
    data = {
        'mission': mission_user.mission,
        'timeline': TimeLineEntry.objects.filter(mission=mission_user.mission),
    }
    return render(request, 'mission_timeline.html', data)


@login_required
@mission_is_admin
def mission_close(request, mission_id, mission_user=None):
    """
    Close a Mission
    """
    if mission_user.mission.closed is not None:
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

    mission_user.mission.closed = timezone.now()
    mission_user.mission.closed_by = request.user
    mission_user.mission.save()

    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))


@login_required
def mission_list(request):
    """
    List missions this user can select from.
    """
    user_missions = MissionUser.objects.filter(user=request.user)
    current_missions = []
    previous_missions = []
    for user_mission in user_missions:
        if user_mission.role == 'A':
            user_mission.mission.is_admin = True
        if user_mission.mission.closed is not None:
            previous_missions.append(user_mission.mission)
        else:
            current_missions.append(user_mission.mission)

    data = {
        'current_missions': current_missions,
        'previous_missions': previous_missions,
    }

    return render(request, 'mission_list.html', data)


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
            mission = Mission(mission_name=form.cleaned_data['mission_name'], creator=request.user)
            mission.save()
            # Give the user who created this mission admin permissions
            MissionUser(mission=mission, user=request.user, role='A', creator=request.user).save()
            return redirect('/mission/{}/details/'.format(mission.pk))

    if form is None:
        form = MissionForm()

    return render(request, 'mission_create.html', {'form': form})


@login_required
@mission_is_admin
def mission_asset_add(request, mission_id, mission_user):
    """
    Add an Asset to a Mission
    """
    form = None
    if request.method == 'POST':
        form = MissionAssetForm(request.POST)
        if form.is_valid():
            # Check if this asset is in any other missions currently
            try:
                mission_asset = MissionAsset.objects.get(asset=form.cleaned_data['asset'], removed__isnull=True)
                return HttpResponseForbidden("Asset is already in another Mission")
            except ObjectDoesNotExist:
                # Create the new mission<->asset
                mission_asset = MissionAsset(mission=mission_user.mission, asset=form.cleaned_data['asset'], creator=request.user)
                mission_asset.save()
                return HttpResponseRedirect('/mission/{}/details/'.format(mission_user.mission.pk))

    if form is None:
        form = MissionAssetForm()

    return render(request, 'mission_asset_add.html', {'form': form})


@login_required
@mission_is_admin
def mission_asset_remove(request, mission_id, mission_user, asset_id):
    """
    Cease using an asset as part of this Mission
    """
    asset = get_object_or_404(Asset, pk=asset_id)
    mission_asset = get_object_or_404(MissionAsset, mission=mission_user.mission, asset=asset, removed__isnull=True)
    mission_asset.remover = request.user
    mission_asset.removed = timezone.now()
    mission_asset.save()

    return HttpResponseRedirect('/mission/{}/details/'.format(mission_user.mission.pk))
