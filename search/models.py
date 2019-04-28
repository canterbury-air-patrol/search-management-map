"""
Models for types of searches

Each search type has a model to represent it,
all inherting from the abstract model (SearchPath)
"""

from django.db import models

from data.models import LineStringTime, PointTimeLabel, LineStringTimeLabel
from assets.models import AssetType, Asset


class SearchPath(LineStringTime):
    """
    An abstract model that presents a search.

    Common parameters are set in this model,
    and it inherits from a model that represents the path.
    """
    created_for = models.ForeignKey(AssetType, on_delete=models.PROTECT)
    sweep_width = models.IntegerField()
    inprogress_by = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='inprogress_by%(app_label)s_%(class)s_related')
    completed = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='completed_by%(app_label)s_%(class)s_related')

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['created_for']),
            models.Index(fields=['inprogress_by']),
            models.Index(fields=['completed']),
        ]


class SectorSearch(SearchPath):
    """
    A sector search from a given point (datum).

    Sector searches are good for finding something when you knew it was at the datum
    very recently (with a few minutes of the search starting).
    A series of equilateral triangles with sides of length no greater than 3x sweep width.
    Each of the triangles has one point on the datum and the other 2 points on a circle
    centered on the datum.
    Each triangle starts 30 degress from the previous one, but they are run in an order
    such that (where possible) the line that connects to the datum continues to start a
    new triangle on the opposite side.
    There are 3 sets of 3 triangles that make up the full set. The first triangles have
    courses (position on clock face)
     000 (12 o'clock)
     120 (2 o'clock)
     240 (datum)
     240 (8 o'clock)
     000 (10 o'clock)
     120 (datum)
     120 (4 o'clock)
     240 (6 o'clock)
     000 (datum)
     The next set start offset 30 degrees (030, 150, 270, etc)
    """
    datum = models.ForeignKey(PointTimeLabel, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', )

    def __str__(self):
        return "Sector Search from {} with {} (sw={})".format(self.datum, self.created_for, self.sweep_width)


class ExpandingBoxSearch(SearchPath):
    """
    An expanding box search from a given point (datum).

    Expanding box searches are good for finding something when you know it was at the datum
    recently (within the last hour)

    A series of straight lines that form a continuous path that expands outwards
    from the datum.
    Each pair of perpendicular lines are n*sweep width (where n is whole number
    that increases every second direction change)
    If the search starts 000 and the sweep width is 100m then it would have lines:
    course (length)
    000 (100m)
    090 (100m)
    180 (200m)
    270 (200m)
    000 (300m)
    090 (300m)
    180 (400m)
    270 (400m)
    And so on, for as many iterations as required (iterations here are groups of 4 lines)

    Expanding boxes have a mathematical property that makes it easy to calculate the
    ends of any line without knowing all the previous ones.
    The first point (b) is 1 sweep width in the starting direction from the datum (a).
    Now all subsequent points expand outwards on a 45 degree angle from either a or b.
    The second, third, forth line all end (start direction +) 45, 135, 225 degrees from
    a, and the fifth line ends (start direction +) 315 degrees, all sqrt(2) * i * sweep
    width (where i is the iteration number) from the reference point (a or b respectively).
    """
    datum = models.ForeignKey(PointTimeLabel, on_delete=models.PROTECT)
    iterations = models.IntegerField()
    first_bearing = models.IntegerField()

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', 'iterations', 'first_bearing', )

    def __str__(self):
        return "Expanding Box Search from {} with {} (sw={}, n={}, start={})".format(self.datum, self.created_for, self.sweep_width, self.iterations, self.first_bearing)


class TrackLineSearch(SearchPath):
    """
    A track line search following a line.

    Track line searches are useful for checking a path known to be travelled.
    They can also be used as to approximate a feature search (like a shoreline, river, etc).
    No math required, the search has exactly the same points as the reference line.
    """
    datum = models.ForeignKey(LineStringTimeLabel, on_delete=models.PROTECT)

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', )

    def __str__(self):
        return "Track Line Search along {} with {} (sw={})".format(self.datum, self.created_for, self.sweep_width)


class TrackLineCreepingSearch(SearchPath):
    """
    A creeping line ahead search following a line.

    A creeping line ahead search (also called a parallel track search) is useful
    for searching a large area methodically.
    This specific implementation centers the search on a line and runs the search
    perpendicular to the line so that runs half the width either side of the line,
    and steps sweep width along the line for each each pass.
    """
    datum = models.ForeignKey(LineStringTimeLabel, on_delete=models.PROTECT)
    width = models.IntegerField()

    GEOJSON_FIELDS = ('pk', 'timestamp', 'created_for', 'inprogress_by', 'sweep_width', 'width', )

    def __str__(self):
        return "Creeping Search along {} with {} (sw={}, width={})".format(self.datum, self.created_for, self.sweep_width, self.width)
