from django.contrib.gis.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from assets.models import Asset


class PointTime(models.Model):
    point = models.PointField(geography=True)
    timestamp = models.DateTimeField(default=timezone.now)
    deleted = models.BooleanField(default=False)
    creator = models.ForeignKey(get_user_model(), on_delete=models.PROTECT)

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
