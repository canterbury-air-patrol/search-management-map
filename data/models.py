from django.contrib.gis.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from assets.models import Asset


class PointTime(models.Model):
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
    alt = models.IntegerField(null=True)
    heading = models.IntegerField(null=True)
    fix = models.IntegerField(null=True)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('asset', 'timestamp', 'alt', 'heading', 'fix',)

    def __str__(self):
        return("{}: {} {}".format(self.asset, self.point, self.timestamp))


class PointTimeLabel(PointTime):
    label = models.TextField()
    replaced_by = models.ForeignKey("PointTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'label',)

    def __str__(self):
        return("{}".format(self.label))


class PolygonTime(models.Model):
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
    label = models.TextField()
    replaced_by = models.ForeignKey("PolygonTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'label', )

    def __str__(self):
        return("{}".format(self.label))


class LineStringTime(models.Model):
    line = models.LineStringField(geography=True)
    timestamp = models.DateTimeField(default=timezone.now)
    deleted = models.BooleanField(default=False)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)

    GEOFIELD = 'line'

    class Meta:
        abstract = True


class LineStringTimeLabel(LineStringTime):
    label = models.TextField()
    replaced_by = models.ForeignKey("LineStringTimeLabel", on_delete=models.SET_NULL, null=True, blank=True)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'label', )

    def __str__(self):
        return("{}".format(self.label))
