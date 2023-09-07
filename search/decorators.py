"""
Function decorators to make dealing with searches easier
"""

from django.shortcuts import get_object_or_404

from .models import Search


def search_from_id(view_func):
    """
    Make sure the exists, and get the object
    """
    def wrapper_get_search(*args, **kwargs):
        search = get_object_or_404(Search, pk=kwargs['search_id'])
        kwargs.pop('search_id')
        return view_func(*args, search=search, **kwargs)
    return wrapper_get_search
