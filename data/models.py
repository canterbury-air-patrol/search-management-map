"""
models for data we store

There are both parent (abstract) models and
models for storing data.
Mostly directly user created, but also some data
that assets provide directly (i.e. position reports).
"""

from django.contrib.gis.db import models
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.gis.db.models.functions import Length
from assets.models import Asset
from mission.models import Mission
from timeline.helpers import timeline_record_create, timeline_record_delete, timeline_record_update


class GeoTime(models.Model):
    """
    An abstract model for storing a geometric object.

    Stores who created it, when.
    Also knows about being deleted (by who and when).

    We track the creation/deletion user/time for auditing
    when something was changed and by who.
    If something is replaceable it should store a link to
    the replacement object, rather than being marked as deleted.
    """
    geo = models.GeometryField(geography=True)
    alt = models.IntegerField(null=True, blank=True)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, related_name='created_by%(app_label)s_%(class)s_related')
    created_at = models.DateTimeField(default=timezone.now)
    deleted_by = models.ForeignKey(get_user_model(), on_delete=models.PROTECT, null=True, blank=True, related_name='deletor%(app_label)s_%(class)s_related')
    deleted_at = models.DateTimeField(null=True, blank=True)
    replaced_by = None
    replaced_at = models.DateTimeField(null=True, blank=True)

    mission = models.ForeignKey(Mission, on_delete=models.PROTECT, null=True)

    GEOFIELD = 'geo'

    def length(self):
        """
        Calculate the total length (in m) of this line
        """
        annotated_self = self.__class__.objects.annotate(length=Length('geo')).get(pk=self.pk)
        return annotated_self.length.m

    @classmethod
    def all_current(cls, mission, current_at=None):
        '''
        Find all the objects that were valid at the current_at time.

        mission is the mission the objects are part of
        current_at being None means now, otherwise only objects that existed at the time will be returned
        '''
        objects = cls.objects.filter(mission=mission)
        if current_at:
            # Filter out any deleted objects
            objects = objects.filter(Q(deleted_at__isnull=True) | Q(deleted_at__gt=current_at))
            objects = objects.filter(Q(replaced_at__isnull=True) | Q(replaced_at__gt=current_at))
            objects = objects.filter(created_at__gt=current_at)
        else:
            objects = objects.filter(deleted_at__isnull=True).filter(replaced_at__isnull=True)
        return objects

    # pylint: disable=W0221
    def save(self, *args, **kwargs):
        exists = False
        replaced = False
        if self.pk is not None:
            exists = True
        try:
            if self.replaced_by:
                replaced = True
        except AttributeError:
            pass

        super().save(*args, **kwargs)
        if exists:
            if replaced:
                timeline_record_update(self.mission, self.created_by, self.replaced_by, self)
            elif self.deleted_at:
                timeline_record_delete(self.mission, self.created_by, self)
        else:
            timeline_record_create(self.mission, self.created_by, self)

    class Meta:
        abstract = True
        indexes = [
            # Index for all_current
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'created_at', ])
        ]


class AssetPointTime(GeoTime):
    """
    Stores the position of an asset at a specific time.

    We use a point rather than a line string because assets
    generally report their position in real time, adding a
    new object is easier than editing an existing one.
    Also, this is easier to filter for a time range.
    """
    heading = models.IntegerField(null=True)
    fix = models.IntegerField(null=True)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('asset', 'created_at', 'heading', 'fix',)

    def __str__(self):
        return "{}: {} {}".format(self.asset, self.geo, self.created_at)

    class Meta:
        indexes = [
            models.Index(fields=['mission', 'asset', '-created_at']),
            models.Index(fields=['mission', 'asset', 'created_at']),
        ]


class GeoTimeLabel(GeoTime):
    """
    This is a geometric object the user has defined.

    We store a label that allows arbitary text, so they can write something
    to give the geomeotry meaning to other users.
    """
    label = models.TextField()
    replaced_by = models.ForeignKey("GeoTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEO_TYPE = (
        ('poi', "Point of Interest"),
        ('line', "Line"),
        ('polygon', "Area"),
    )
    geo_type = models.CharField(max_length=10, choices=GEO_TYPE)

    GEOJSON_FIELDS = ('pk', 'created_at', 'label',)

    def __str__(self):
        return "{}".format(self.label)

    @classmethod
    def all_current_of_geo(cls, mission, geo_type, current_at=None):
        '''
        Find all the objects of the given geo_type that were valid at the current_at time.

        mission is the mission the objects are part of
        geo_type needs to be one of GEO_TYPE
        current_at being None means now, otherwise only objects that existed at the time will be returned
        '''
        objects = cls.all_current(mission, current_at=current_at).filter(geo_type=geo_type)
        return objects

    class Meta:
        indexes = [
            # Indexes for both cases of all_current_of_geo
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'created_at', 'geo_type', ]),
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'geo_type', ]),
        ]
