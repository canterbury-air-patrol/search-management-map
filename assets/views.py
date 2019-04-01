from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from .models import AssetType


@login_required
def asset_types_list(request):
    asset_types = AssetType.objects.all()

    asset_types_json = []
    for at in asset_types:
        asset_types_json = {
            'id': at.pk,
            'name': at.name,
        }

    data = {
        'asset_types': asset_types_json,
    }

    return JsonResponse(data)
