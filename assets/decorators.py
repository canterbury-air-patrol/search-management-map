"""
Function decorators for assets
"""

from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden
from .models import Asset


def asset_is_recorder(view_func):
    """
    Make sure the current user is allowed to record (positions) for this asset.
    """
    def recorder_check(*args, **kwargs):
        asset = get_object_or_404(Asset, name=kwargs['asset_name'])
        if asset.owner != args[0].user:
            return HttpResponseForbidden("Not Authorized to record the position of this asset")
        return view_func(*args, asset=asset, **kwargs)
    return recorder_check
