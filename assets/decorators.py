"""
Function decorators for assets
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden, HttpResponseNotAllowed
from .models import Asset


def asset_is_recorder(view_func):
    """
    Make sure the current user is allowed to record (positions) for this asset.
    """
    def recorder_check(*args, **kwargs):
        asset = get_object_or_404(Asset, name=kwargs['asset_name'])
        if asset.owner != args[0].user:
            return HttpResponseForbidden("Not Authorized to record the position of this asset")
        kwargs.pop('asset_name')
        return view_func(*args, asset=asset, **kwargs)
    return recorder_check


def asset_id_in_get_post(view_func):
    """
    Make sure the asset_id in the GET/POST is a valid assest and this user can act as them.
    """
    def asset_id_check(*args, **kwargs):
        request = args[0]
        if request.method == 'GET':
            asset_id = request.GET.get('asset_id')
        elif request.method == 'POST':
            asset_id = request.POST.get('asset_id')
        else:
            return HttpResponseNotAllowed("Only GET and POST are supported")
        asset = get_object_or_404(Asset, pk=asset_id)
        if asset.owner != request.user:
            return HttpResponseForbidden("Wrong User for Asset")

        return view_func(*args, asset=asset, **kwargs)
    return asset_id_check
