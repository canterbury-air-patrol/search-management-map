"""
Views for assets
"""
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .models import AssetType, Asset


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
