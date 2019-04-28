"""
models for data we store

There are both parent (abstract) models and
models for storing data.
Mostly directly user created, but also some data
that assets provide directly (i.e. position reports).
"""

from django.contrib.gis.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from assets.models import Asset


class PointTime(models.Model):
    """
    An abstract model for storing a point.

    Stores who created it, when.
    Also knows about being deleted (by who and when).

    We track the creation/deletion user/time for auditing
    when something was changed and by who.
    If something is replaceable it should store a link to
    the replacement object, rather than being marked as deleted.
    """
    point = models.PointField(geography=True)
    timestamp = models.DateTimeField(default=timezone.now)
    deleted = models.BooleanField(default=False)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    deleted_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, null=True, blank=True, related_name='deletor%(app_label)s_%(class)s_related')
    deleted_at = models.DateTimeField(null=True, blank=True)

    GEOFIELD = 'point'

    class Meta:
        abstract = True


class AssetPointTime(PointTime):
    """
    Stores the position of an asset at a specific time.

    We use a point rather than a line string because assets
    generally report their position in real time, adding a
    new object is easier than editing an existing one.
    Also, this is easier to filter for a time range.
    """
    alt = models.IntegerField(null=True)
    heading = models.IntegerField(null=True)
    fix = models.IntegerField(null=True)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('asset', 'timestamp', 'alt', 'heading', 'fix',)

    def __str__(self):
        return "{}: {} {}".format(self.asset, self.point, self.timestamp)

    class Meta:
        indexes = [
            models.Index(fields=['asset', '-timestamp']),
            models.Index(fields=['asset', 'timestamp']),
        ]


class PointTimeLabel(PointTime):
    """
    This is a POI (point of interest) the user has defined.

    We store a label that allows arbitary text, so they can write something
    to give the point meaning to other users.
    """
    label = models.TextField()
    replaced_by = models.ForeignKey("PointTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'label',)

    def __str__(self):
        return "{}".format(self.label)

    class Meta:
        indexes = [
            models.Index(fields=['deleted', 'replaced_by']),
        ]


class PolygonTime(models.Model):
    """
    An abstract model for storing a simple polygon.

    We only support defining the outside of the polygon.

    Stores who created it, when.
    Also knows about being deleted (by who and when).

    We track the creation/deletion user/time for auditing
    when something was changed and by who.
    If something is replaceable it should store a link to
    the replacement object, rather than being marked as deleted.
    """
    polygon = models.PolygonField(geography=True)
    timestamp = models.DateTimeField(default=timezone.now)
    deleted = models.BooleanField(default=False)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='creator%(app_label)s_%(class)s_related')
    deleted_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, null=True, blank=True, related_name='deletor%(app_label)s_%(class)s_related')
    deleted_at = models.DateTimeField(null=True, blank=True)

    GEOFIELD = 'polygon'

    class Meta:
        abstract = True


class PolygonTimeLabel(PolygonTime):
    """
    This is a polygon the user has defined.

    We store a label that allows arbitary text, so they can write something
    to give the point meaning to other users.
    """
    label = models.TextField()
    replaced_by = models.ForeignKey("PolygonTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'label', )

    def __str__(self):
        return "{}".format(self.label)

    class Meta:
        indexes = [
            models.Index(fields=['deleted', 'replaced_by']),
        ]


class LineStringTime(models.Model):
    """
    An abstract model for storing a line (string of point).

    Stores who created it, when.
    Also knows about being deleted (by who and when).

    We track the creation/deletion user/time for auditing
    when something was changed and by who.
    If something is replaceable it should store a link to
    the replacement object, rather than being marked as deleted.
    """
    line = models.LineStringField(geography=True)
    timestamp = models.DateTimeField(default=timezone.now)
    deleted = models.BooleanField(default=False)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)

    GEOFIELD = 'line'

    class Meta:
        abstract = True


class LineStringTimeLabel(LineStringTime):
    """
    This a line/track the user has defined.

    We store a label that allows arbitary text, so they can write something
    to give the point meaning to other users.
    """
    label = models.TextField()
    replaced_by = models.ForeignKey("LineStringTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'label', )

    def __str__(self):
        return "{}".format(self.label)

    class Meta:
        indexes = [
            models.Index(fields=['deleted', 'replaced_by']),
        ]
