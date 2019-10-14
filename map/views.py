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
def map_main(request, mission_id, mission_user=None):
    """
    Present the user the map
    """
    return render(request, 'map_main.html', {'mission': mission_user.mission})


@login_required
def recording(request):
    """
    Present the user the recording page
    """
    data = {
        'form': AssetSelectorForm(user=request.user),
    }
    return render(request, 'recorder.html', data)
