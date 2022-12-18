"""
Views for assets
"""
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404, render

from mission.decorators import mission_is_member, mission_asset_get

from search.models import Search
from search.view_helpers import check_searches_in_progress

from .decorators import asset_is_recorder
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
@asset_is_recorder
def assets_ui(request, asset):
    """
    Present UI for an Asset
    """
    return render(request, 'assets/ui.html', {'assetName': asset.name})


@login_required
def asset_details(request, asset_name):
    """
    Provide the details of an asset
    """
    asset = get_object_or_404(Asset, name=asset_name)

    data = {
        'asset_id': asset.pk,
        'name': asset.name,
        'asset_type': asset.asset_type.name,
        'owner': str(asset.owner)
    }

    data['last_command'] = AssetCommand.last_command_for_asset_to_json(asset)

    mission_asset = mission_asset_get(asset)
    if mission_asset is not None:
        data['mission_id'] = mission_asset.mission.pk
        data['mission_name'] = mission_asset.mission.mission_name

        current_search = check_searches_in_progress(mission_asset.mission, asset)
        if current_search is not None:
            data['current_search_id'] = current_search.pk
        queued_search = Search.oldest_queued_for_asset(mission_asset.mission, asset)
        if queued_search is not None:
            data['queued_search_id'] = queued_search.pk

    return JsonResponse(data)


@login_required
@mission_is_member
def asset_command_set(request, mission_user):
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
                    return HttpResponseBadRequest('Invalid lat/long')
            asset_command = AssetCommand(asset=form.cleaned_data['asset'], command=form.cleaned_data['command'], issued_by=request.user, reason=form.cleaned_data['reason'], position=point, mission=mission_user.mission)
            asset_command.save()
            return HttpResponse("Created")

    if form is None:
        form = AssetCommandForm(mission=mission_user.mission)

    return render(request, 'asset-command-form.html', {'form': form})
