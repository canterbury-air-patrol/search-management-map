"""
Function decorators to make dealing with images easier
"""

from django.shortcuts import get_object_or_404

from .models import GeoImage


def image_from_id(view_func):
    """
    Make sure the geoimage exists, and get the object
    """
    def wrapper_get_geoimage(*args, **kwargs):
        image = get_object_or_404(GeoImage, id=kwargs['image_id'])
        kwargs.pop('image_id')
        return view_func(*args, image=image, **kwargs)
    return wrapper_get_geoimage


def image_get_mission_id(view_func):
    """
    Extract the mission_id from the geoimage object
    """
    def wrapper_get_mission_id(*args, **kwargs):
        mission_id = kwargs['image'].mission.id
        return view_func(*args, mission_id=mission_id, **kwargs)
    return wrapper_get_mission_id
