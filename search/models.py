from django.db import models

from data.models import LineStringTime, PointTimeLabel, LineStringTimeLabel
from assets.models import AssetType, Asset


class SearchPath(LineStringTime):
    created_for = models.ForeignKey(AssetType, on_delete=models.PROTECT)
    sweep_width = models.IntegerField()
    inprogress_by = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='inprogress_by%(app_label)s_%(class)s_related')
    completed = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='completed_by%(app_label)s_%(class)s_related')

    class Meta:
        abstract = True


class SectorSearch(SearchPath):
    datum = models.ForeignKey(PointTimeLabel, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', )

    def __str__(self):
        return("Sector Search from {} with {} (sw={})".format(self.datum, self.created_for, self.sweep_width))


class ExpandingBoxSearch(SearchPath):
    datum = models.ForeignKey(PointTimeLabel, on_delete=models.PROTECT)
    iterations = models.IntegerField()
    first_bearing = models.IntegerField()

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', 'iterations', 'first_bearing', )

    def __str__(self):
        return("Expanding Box Search from {} with {} (sw={}, n={}, start={})".format(self.datum, self.created_for, self.sweep_width, self.iterations, self.first_bearing))


class TrackLineSearch(SearchPath):
    datum = models.ForeignKey(LineStringTimeLabel, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', )

    def __str__(self):
        return("Track Line Search along {} with {} (sw={})".format(self.datum, self.created_for, self.sweep_width))


class TrackLineCreepingSearch(SearchPath):
    datum = models.ForeignKey(LineStringTimeLabel, on_delete=models.PROTECT)
    width = models.IntegerField()

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', 'width', )

    def __str__(self):
        return("Creeping Search along {} with {} (sw={}, width={})".format(self.datum, self.created_for, self.sweep_width, self.width))
