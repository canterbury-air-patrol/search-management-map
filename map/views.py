"""
Views for the map

These views should only relate to presentation of the UI
"""

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from mission.decorators import mission_is_member
from .forms import AssetSelectorForm


@login_required
@mission_is_member
def map_main(request, mission_user):
    """
    Present the user the map
    """
    return render(request, 'map_main.html', {'mission': mission_user.mission})

@login_required
def map_main_all(request):
    """
    Present the user a map showing all missions they can see on it
    """
    return render(request, 'map_main.html', {'mission': 'all'})

@login_required
def map_main_current(request):
    """
    Present the user a map showing all current missions they can see on it
    """
    return render(request, 'map_main.html', {'mission': 'current'})

@login_required
def recording(request):
    """
    Present the user the recording page
    """
    data = {
        'form': AssetSelectorForm(user=request.user),
    }
    return render(request, 'recorder.html', data)
