"""
Views for the map

These views should only relate to presentation of the UI
"""

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from .forms import AssetSelectorForm


@login_required
def map_main(request):
    """
    Present the user the map
    """
    return render(request, 'map_main.html', {})


@login_required
def recording(request):
    """
    Present the user the recording page
    """
    data = {
        'form': AssetSelectorForm(user=request.user),
    }
    return render(request, 'recorder.html', data)
