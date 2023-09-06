"""
Function decorators to make dealing with data models easier
"""

from django.shortcuts import get_object_or_404

from .models import GeoTimeLabel


def geotimelabel_from_type_id(view_func):
    """
    Make sure the geotimelabel exists, is the right type, and get the object
    """
    def wrapper_get_geotimelabel(*args, **kwargs):
        usergeo = get_object_or_404(GeoTimeLabel, id=kwargs['geo_id'], geo_type=kwargs['geo_type'])
        kwargs.pop('geo_id')
        kwargs.pop('geo_type')
        return view_func(*args, usergeo=usergeo, **kwargs)
    return wrapper_get_geotimelabel


def geotimelabel_get_mission_id(view_func):
    """
    Extract the mission_id from the geotimelabel object
    """
    def wrapper_get_mission_id(*args, **kwargs):
        mission_id = kwargs['usergeo'].mission.id
        return view_func(*args, mission_id=mission_id, **kwargs)
    return wrapper_get_mission_id
