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
