"""
Function decorators to make dealing with marine sar models easier
"""

from django.shortcuts import get_object_or_404

from .models import MarineTotalDriftVector


def total_drift_from_type_id(view_func):
    """
    Make sure the marinetotaldriftvector exists, and get the object
    """
    def wrapper_get_marine_tdv(*args, **kwargs):
        tdv = get_object_or_404(MarineTotalDriftVector, id=kwargs['tdv_id'])
        kwargs.pop('tdv_id')
        return view_func(*args, tdv=tdv, **kwargs)
    return wrapper_get_marine_tdv
