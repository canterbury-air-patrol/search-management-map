"""
Models for images
"""

from django.db import models
from data.models import GeoTime


class GeoImage(GeoTime):
    """
    This is an image that has been uploaded by a user.

    We store the position and a description, plus allow for flagging as important.
    """
    description = models.TextField()
    original_format = models.CharField(max_length=10)
    priority = models.BooleanField(default=False)
    replaced_by = models.ForeignKey("GeoImage", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'created_at', 'description', 'priority', )

    def __str__(self):
        # pylint: disable=E1136
        return f"Image ({self.description}) @ {self.geo[0]}, {self.geo[1]}"
