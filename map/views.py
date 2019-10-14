"""
Views for the map

These views should only relate to presentation of the UI
"""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required

from mission.models import Mission
from .forms import AssetSelectorForm


@login_required
def map_main(request, mission_id):
    """
    Present the user the map
    """
    mission = get_object_or_404(Mission, pk=mission_id)
    return render(request, 'map_main.html', {'mission': mission})


@login_required
def recording(request):
    """
    Present the user the recording page
    """
    data = {
        'form': AssetSelectorForm(user=request.user),
    }
    return render(request, 'recorder.html', data)
