"""
Views for assets
"""
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.shortcuts import render

from mission.decorators import mission_is_member

from .models import AssetType, Asset, AssetCommand
from .forms import AssetCommandForm


@login_required
def asset_types_list(request):
    """
    List all the asset types
    """
    asset_types = AssetType.objects.all()

    asset_types_json = []
    for asset_type in asset_types:
        asset_types_json.append({
            'id': asset_type.pk,
            'name': asset_type.name,
        })

    data = {
        'asset_types': asset_types_json,
    }

    return JsonResponse(data)


@login_required
def assets_mine_list(request):
    """
    List all the assets that belong to the current user
    """
    assets = Asset.objects.filter(owner=request.user)

    assets_json = []
    for asset in assets:
        assets_json.append({
            'id': asset.pk,
            'name': asset.name,
            'type_id': asset.asset_type.id,
            'type_name': asset.asset_type.name,
        })

    data = {
        'assets': assets_json,
    }

    return JsonResponse(data)


@login_required
@mission_is_member
def asset_command_set(request, mission_id, mission_user):
    """
    Set the command for a given asset.
    """
    form = None
    if request.method == 'POST':
        form = AssetCommandForm(request.POST, mission=mission_user.mission)
        if form.is_valid():
            point = None
            if form.cleaned_data['command'] in AssetCommand.REQUIRES_POSITION:
                latitude = request.POST.get('latitude')
                longitude = request.POST.get('longitude')
                try:
                    point = Point(float(longitude), float(latitude))
                except (ValueError, TypeError):
                    HttpResponseBadRequest('Invalid lat/long')
            asset_command = AssetCommand(asset=form.cleaned_data['asset'], command=form.cleaned_data['command'], issued_by=request.user, reason=form.cleaned_data['reason'], position=point, mission=mission_user.mission)
            asset_command.save()
            return HttpResponse("Created")

    if form is None:
        form = AssetCommandForm(mission=mission_user.mission)

    return render(request, 'asset-command-form.html', {'form': form})
