"""
Function decorators for assets
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden, HttpResponseNotAllowed

from organization.helpers import organization_user_is_asset_recorder, organization_user_is_asset_radio_operator

from .models import Asset


def asset_is_recorder(view_func):
    """
    Make sure the current user is allowed to record (positions) for this asset.
    """
    def recorder_check(*args, **kwargs):
        allowed = False
        asset = get_object_or_404(Asset, pk=kwargs['asset_id'])
        if asset.owner == args[0].user or organization_user_is_asset_recorder(args[0].user, asset):
            allowed = True
        if not allowed:
            return HttpResponseForbidden("Not Authorized to record the position of this asset")
        kwargs.pop('asset_id')
        return view_func(*args, asset=asset, **kwargs)
    return recorder_check


def asset_is_operator(view_func):
    """
    Make sure the current user is allowed to act on behalf of this asset.
    """
    def recorder_check(*args, **kwargs):
        allowed = False
        asset = get_object_or_404(Asset, pk=kwargs['asset_id'])
        if asset.owner == args[0].user or organization_user_is_asset_radio_operator(args[0].user, asset):
            allowed = True
        if not allowed:
            return HttpResponseForbidden("Not Authorized to record the position of this asset")
        kwargs.pop('asset_id')
        return view_func(*args, asset=asset, **kwargs)
    return recorder_check


def asset_is_owner(view_func):
    """
    Make sure the current user is the owner of this asset.
    """
    def asset_owner_check(*args, **kwargs):
        asset = get_object_or_404(Asset, pk=kwargs['asset_id'])
        if asset.owner != args[0].user:
            return HttpResponseForbidden("Not Authorized, this is not your asset")
        kwargs.pop('asset_id')
        return view_func(*args, asset=asset, **kwargs)
    return asset_owner_check


def asset_id_in_get_post(view_func):
    """
    Make sure the asset_id in the GET/POST is a valid asset and this user can act as them.
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
        allowed = False
        if asset.owner == request.user or organization_user_is_asset_radio_operator(args[0].user, asset):
            allowed = True
        if not allowed:
            return HttpResponseForbidden("Wrong User for Asset")

        return view_func(*args, asset=asset, **kwargs)
    return asset_id_check
