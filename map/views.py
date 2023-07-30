"""
Views for the map

These views should only relate to presentation of the UI
"""

from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from mission.decorators import mission_is_member
from .models import MapTileLayer


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


def tile_layer_list(request):
    """
    List the tile layers that are currently active
    """
    active_tile_layers = MapTileLayer.objects.filter(active=True).order_by('relativeOrder')
    data = {'layers': list(active_tile_layers.values())}

    return JsonResponse(data)
