"""
Mission Create/Management Views.
"""

from datetime import datetime

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect

from .models import Mission, MissionUser
from .forms import MissionForm


@login_required
def mission_details(request, mission_id):
    """
    Missions details and management.
    """
    mission = get_object_or_404(Mission, pk=mission_id)
    return render(request, 'mission_details.html', {'mission': mission})


@login_required
def mission_close(request, mission_id):
    """
    Close a Mission
    """
    mission = get_object_or_404(Mission, pk=mission_id)
    if mission.closed is not None:
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    user_mission = get_object_or_404(MissionUser, mission=mission, user=request.user)

    if user_mission.role == 'A':
        mission.closed = datetime.now()
        mission.closed_by = request.user
        mission.save()

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
