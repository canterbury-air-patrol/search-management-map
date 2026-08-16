"""
App definition for search
"""

from django.apps import AppConfig


class SearchConfig(AppConfig):
    """
    Define the search app
    """
    name = 'search'

    def ready(self):
        """
        Connect the signal handlers that link asset commands to searches
        """
        from . import signals  # noqa: F401  pylint: disable=C0415,W0611
