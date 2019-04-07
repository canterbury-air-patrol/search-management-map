from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .models import AssetType, Asset


@login_required
def asset_types_list(request):
    asset_types = AssetType.objects.all()

    asset_types_json = []
    for at in asset_types:
        asset_types_json.append({
            'id': at.pk,
            'name': at.name,
        })

    data = {
        'asset_types': asset_types_json,
    }

    return JsonResponse(data)


@login_required
def assets_mine_list(request):
    assets = Asset.objects.filter(owner=request.user)

    assets_json = []
    for a in assets:
        assets_json.append({
            'id': a.pk,
            'name': a.name,
            'type_id': a.asset_type.id,
            'type_name': a.asset_type.name,
        })

    data = {
        'assets': assets_json,
    }

    return JsonResponse(data)
