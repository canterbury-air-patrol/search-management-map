"""
Models for types of searches

Each search type has a model to represent it,
all inherting from the abstract model (SearchPath)
"""
import math

from django.db import models, connection as dbconn
from django.db.models import Func, Q
from django.contrib.gis.db.models.functions import Distance
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import GEOSGeometry, LineString
from django.utils import timezone

from data.models import GeoTime, GeoTimeLabel
from assets.models import AssetType, Asset
from search.polygon.convex import creep_line_concave as polygon_creep_line
from search.polygon.convex import conv_lonlat_to_meters, conv_meters_to_lonlat
from timeline.helpers import timeline_record_search_queue, timeline_record_search_begin


def dictfetchall(cursor):
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


class SearchParams():
    """
    Basic parameters for a search
    """
    def __init__(self, from_geo, asset_type, creator, sweep_width):
        self._from_geo = from_geo
        if not isinstance(asset_type, AssetType):
            raise TypeError("asset_type is not an AssetType")
        self._asset_type = asset_type
        if not isinstance(creator, get_user_model()):
            raise TypeError("creator is not a User")
        self._creator = creator
        self._sweep_width = int(sweep_width)
        if self._sweep_width < 0:
            raise ValueError("Sweep width must be positive")

    def from_geo(self):
        """
        Return the base user geometry used as a reference for the search
        """
        return self._from_geo

    def asset_type(self):
        """
        Return the asset type that this search applies to
        """
        return self._asset_type

    def creator(self):
        """
        Return the user who is creating this search
        """
        return self._creator

    def sweep_width(self):
        """
        Return the sweep width in meters for this search
        """
        return self._sweep_width


class FirstPointDistance(Func):
    """
    Calculates the distance from a given point to the first point on the search line
    """
    # pylint: disable=W0223
    function = 'ST_Distance'

    def as_sql(self, compiler, connection, function=None, template=None, arg_joiner=None, **extra_context):
        # pylint: disable=R0913,R0917
        point_sql = f"ST_Point({self.extra['point'].x},{self.extra['point'].y},4326)::geography"
        return super().as_sql(compiler, connection, function='ST_Distance', template="%(function)s(ST_PointN(geo::geometry,1)::geography, " + point_sql + ")",
                              arg_joiner=arg_joiner, extra_context=extra_context)


class Search(GeoTime):
    """
    A search that an asset can undertake and complete.

    There are a variety of search types we can handle, each one has it's own create function.
    """
    created_for = models.ForeignKey(AssetType, on_delete=models.PROTECT)
    sweep_width = models.IntegerField()
    inprogress_at = models.DateTimeField(null=True, blank=True)
    inprogress_by = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='inprogress_by%(app_label)s_%(class)s_related')
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='completed_by%(app_label)s_%(class)s_related')

    queued_at = models.DateTimeField(null=True, blank=True)
    queued_for_asset = models.ForeignKey(Asset, on_delete=models.PROTECT, null=True, blank=True, related_name='queued_for_assettype%(app_label)s_%(class)s_related')

    datum = models.ForeignKey(GeoTimeLabel, on_delete=models.PROTECT)

    search_type = models.CharField(max_length=20, null=True)
    iterations = models.IntegerField(null=True)
    first_bearing = models.IntegerField(null=True)
    width = models.IntegerField(null=True)

    GEOJSON_FIELDS = (
        'pk',
        'created_at',
        'created_by',
        'created_for',
        'datum',
        'deleted_at',
        'deleted_by',
        'replaced_at',
        'replaced_by',
        'inprogress_at',
        'inprogress_by',
        'completed_at',
        'completed_by',
        'sweep_width',
        'queued_at',
        'queued_for_asset',
        'search_type',
        'iterations',
        'first_bearing',
        'width', )

    def distance_from(self, point):
        """
        Calculate the distance (in m) from a point to the start of this search
        """
        annotated_self = self.__class__.objects.annotate(distance=FirstPointDistance('geo', output_field=models.FloatField(), point=point)).get(pk=self.pk)
        return annotated_self.distance

    @classmethod
    def all_waiting(cls, mission):
        """
        Get all searches for this mission that haven't been started or deleted
        """
        return cls.all_current(mission, finished=False).filter(inprogress_by__isnull=True)

    @classmethod
    def filter_objects(cls, objects, current_at=None, started=False, finished=False):
        """
        Construct the filter for current_at + finished
        """
        if current_at:
            if started:
                objects = objects.filter(inprogress_at__lt=current_at)
            else:
                objects = objects.filter(Q(inprogress_at__isnull=True) | Q(inprogress_at__gt=current_at))
            if finished:
                objects = objects.filter(completed_at__lt=current_at)
            else:
                objects = objects.filter(Q(completed_at__isnull=True) | Q(completed_at__gt=current_at))
        else:
            objects = objects.filter(inprogress_at__isnull=not started)
            objects = objects.filter(completed_at__isnull=not finished)
        return objects

    @classmethod
    def all_current(cls, mission, current_at=None, started=False, finished=False):
        """
        Get all the searches that are current and finished as per params
        """
        objects = super(Search, cls).all_current(mission, current_at=current_at)
        return cls.filter_objects(objects, current_at=current_at, started=started, finished=finished)

    @classmethod
    # pylint: disable=R0913,R0917
    def all_current_user(cls, user, current_at=None, current_only=False, started=False, finished=False):
        """
        Get all the searches that are current and finished as per params
        """
        objects = super(Search, cls).all_current_user(user, current_at=current_at, current_only=current_only)
        return cls.filter_objects(objects, current_at=current_at, started=started, finished=finished)

    @classmethod
    def find_closest(cls, mission, asset_type, point):
        """
        Find the search with the closest starting point
        Only searches that haven't been started or deleted and are for the right asset type are considered
        """
        try:
            possibles = cls.all_waiting(mission).filter(created_for=asset_type)
            return possibles.annotate(distance=Distance('geo', point)).order_by(
                'distance'
            )[0]
        except IndexError:
            return None

    @classmethod
    def oldest_queued_for_asset(cls, mission, asset):
        """
        Find the oldest queued search for this asset
        Only entries that haven't already been started/deleted are considered
        """
        try:
            return (
                cls.all_waiting(mission)
                .filter(queued_for_asset=asset)
                .filter(queued_at__isnull=False)
                .order_by('queued_at')[0]
            )
        except IndexError:
            return None

    @classmethod
    def oldest_queued_for_asset_type(cls, mission, asset_type):
        """
        Find the oldest queued search for this asset_type
        Only entries that haven't already been used/deleted are considered
        """
        try:
            return (
                cls.all_waiting(mission)
                .filter(queued_for_asset__isnull=True)
                .filter(created_for=asset_type)
                .filter(queued_at__isnull=False)
                .order_by('queued_at')[0]
            )
        except IndexError:
            return None

    def get_match(self):
        """
        Get the match object associated with this queue entry
         - an asset, if this search is for a specific asset
         - an assettype, if this search is for any asset of a type
        """
        if self.queued_for_asset:
            return self.queued_for_asset
        return self.created_for

    def queue_search(self, mission_user, asset=None):
        '''
        Queue this search for an asset
        '''
        Search.objects.filter(pk=self.pk, inprogress_by__isnull=True, deleted_at__isnull=True, queued_at__isnull=True).update(queued_at=timezone.now(), queued_for_asset=asset)
        self.refresh_from_db()
        if self.queued_for_asset == asset:
            timeline_record_search_queue(mission_user.mission, mission_user.user, self, self.created_for, asset)
            return True
        return False

    def set_inprogress_by(self, asset, user):
        '''
        Set the asset that conducting this search
        '''
        Search.objects.filter(pk=self.pk, inprogress_by__isnull=True, deleted_at__isnull=True).update(inprogress_at=timezone.now(), inprogress_by=asset)
        self.refresh_from_db()
        if self.inprogress_by == asset:
            timeline_record_search_begin(self.mission, user, asset, self)
            return True
        return False

    def delete(self, user):
        '''
        Delete this search
        '''
        time = timezone.now()
        Search.objects.filter(pk=self.pk, inprogress_by__isnull=True, deleted_at__isnull=True).update(deleted_at=time, deleted_by=user)
        return self.check_and_record_delete(time)

    @staticmethod
    def create_sector_search(params, save=False):
        """
        Create a sector search centered on the given point

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
        # calculate the points on the outside of a circle
        # that are sweep_width * 3 from the poi
        # with angles: 30,60,90,120,150,180,210,240,270,300,330,360
        # this order makes the points in clock-order
        query = "SELECT geo"
        for deg in (30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0):
            query += ", ST_Project(geo, {sw}, radians({deg})) AS deg_{deg}".format(**{'sw': params.sweep_width() * 3, 'deg': deg})
        query += f" FROM data_geotimelabel WHERE id = {params.from_geo().pk}"
        cursor = dbconn.cursor()
        cursor.execute(query)
        reference_points = cursor.fetchone()

        # Create a SectorSector
        points_order = [0, 12, 2, 8, 10, 4, 6, 0, 1, 3, 9, 11, 5, 7, 0, 2, 4, 10, 12, 6, 8, 0]
        points = [GEOSGeometry(reference_points[point]) for point in points_order]
        search = Search(
            geo=LineString(points),
            created_by=params.creator(),
            datum=params.from_geo(),
            created_for=params.asset_type(),
            sweep_width=params.sweep_width(),
            mission=params.from_geo().mission,
            search_type='Sector')
        if save:
            search.save()

        return search

    @staticmethod
    def create_expanding_box_search(params, save=False):
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
        query = "SELECT p.geo, p.first"
        for i in range(1, params.iterations() + 1):
            dist = math.sqrt(2) * i * params.sweep_width()
            query += f", ST_Project(p.geo, {dist}, radians({45 + params.first_bearing()}))"
            query += f", ST_Project(p.geo, {dist}, radians({135 + params.first_bearing()}))"
            query += f", ST_Project(p.geo, {dist}, radians({225 + params.first_bearing()}))"
            query += f", ST_Project(p.first, {dist}, radians({315 + params.first_bearing()}))"

        query += f" FROM (SELECT geo, ST_Project(geo, {params.sweep_width()}, radians({params.first_bearing()})) AS first FROM data_geotimelabel WHERE id = {params.from_geo().pk}) AS p"

        cursor = dbconn.cursor()
        cursor.execute(query)
        points = [GEOSGeometry(p) for p in cursor.fetchone()]

        search = Search(
            geo=LineString(points),
            created_by=params.creator(),
            datum=params.from_geo(),
            created_for=params.asset_type(),
            sweep_width=params.sweep_width(),
            iterations=params.iterations(),
            first_bearing=params.first_bearing(),
            mission=params.from_geo().mission,
            search_type='Expanding Box')
        if save:
            search.save()

        return search

    @staticmethod
    def create_track_line_search(params, save=False):
        """
        A track line search following a line.

        Track line searches are useful for checking a path known to be travelled.
        No math required, the search has exactly the same points as the reference line.
        """
        search = Search(
            geo=params.from_geo().geo,
            created_by=params.creator(),
            datum=params.from_geo(),
            created_for=params.asset_type(),
            sweep_width=params.sweep_width(),
            mission=params.from_geo().mission,
            search_type='Track Line')
        if save:
            search.save()
        return search

    @staticmethod
    def create_shore_line_search(params, save=False):
        """
        A shore line search following a line.

        Shore line searches are useful for checking a shore line.
        No math required, the search has exactly the same points as the reference line.
        """
        search = Search(
            geo=params.from_geo().geo,
            created_by=params.creator(),
            datum=params.from_geo(),
            created_for=params.asset_type(),
            sweep_width=params.sweep_width(),
            mission=params.from_geo().mission,
            search_type='Shore Line')
        if save:
            search.save()
        return search

    @staticmethod
    def create_track_line_creeping_search(params, save=False):
        """
        A creeping line ahead search following a line.

        A creeping line ahead search (also called a parallel track search) is useful
        for searching a large area methodically.
        This specific implementation centers the search on a line and runs the search
        perpendicular to the line so that runs half the width either side of the line,
        and steps sweep width along the line for each each pass.
        """
        segment_query = \
            "SELECT ST_PointN(geo::geometry, pos)::geography AS start, ST_PointN(geo::geometry, pos + 1)::geography AS end" \
            f" FROM data_geotimelabel, generate_series(1, ST_NPoints(geo::geometry) - 1) AS pos WHERE id = {params.from_geo().pk}"

        line_data_query = \
            f"SELECT segment.start AS start, ST_Azimuth(segment.start::geometry, segment.end::geometry) AS direction, ST_Distance(segment.start, segment.end) AS distance FROM ({segment_query}) AS segment"
        line_points_query = \
            f"SELECT direction AS direction, ST_Project(linedata.start, {params.sweep_width()} * i, direction) AS point"\
            f" FROM ({line_data_query}) AS linedata, generate_series(0, (linedata.distance/{params.sweep_width()})::integer) AS i"
        query = \
            f"SELECT ST_Project(point, {params.width()}, direction + PI()/2) AS A, ST_Project(point, {params.width()}, direction - PI()/2) AS B FROM ({line_points_query}) AS linepoints;"

        cursor = dbconn.cursor()
        cursor.execute(query)
        db_points = dictfetchall(cursor)

        points = []
        reverse = False
        for segment in db_points:
            if reverse:
                points.extend((GEOSGeometry(segment['b']), GEOSGeometry(segment['a'])))
                reverse = False
            else:
                points.extend((GEOSGeometry(segment['a']), GEOSGeometry(segment['b'])))
                reverse = True

        search = Search(
            geo=LineString(points),
            created_by=params.creator(),
            datum=params.from_geo(),
            created_for=params.asset_type(),
            sweep_width=params.sweep_width(),
            width=params.width(),
            mission=params.from_geo().mission,
            search_type='Creeping Line')
        if save:
            search.save()

        return search

    @staticmethod
    def create_polygon_creeping_line_search(params, save=False):
        """
        A polygon search for a given area (LinearRing).

        Creates a search that sweeps across a polygon
        """
        poly = params.from_geo().geo
        lrng_lonlat = poly[0]

        skew_point = lrng_lonlat[0]
        lrng_meters = conv_lonlat_to_meters(lrng_lonlat)

        sweep_width = params.sweep_width()

        line_meters = polygon_creep_line(lrng_meters, sweep_width)
        line_lonlat = conv_meters_to_lonlat(line_meters, skew_point)

        search = Search(
            geo=line_lonlat,
            created_by=params.creator(),
            datum=params.from_geo(),
            created_for=params.asset_type(),
            sweep_width=params.sweep_width(),
            mission=params.from_geo().mission,
            search_type='Parallel Line')
        if save:
            search.save()
        return search

    def __str__(self):
        return f"{self.search_type} search from {self.datum}, sweep width = {self.sweep_width}, asset class = {self.created_for}"

    class Meta:
        indexes = [
            # Indexes for both cases of all_current_of_*complete*
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'created_at', 'completed_at', ]),
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'completed_at', ]),
            # Index for all_waiting
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'completed_at', 'inprogress_by', ]),
            # Index for find_closest
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'completed_at', 'inprogress_by', 'created_for', ]),
            # Index for oldest_queued_for_asset*
            models.Index(fields=['mission', 'deleted_at', 'replaced_at', 'completed_at', 'inprogress_by', 'queued_for_asset', 'created_for', ]),
            # Index for inprogress_by (used to find the search an asset is currently doing)
            models.Index(fields=['inprogress_by']),
        ]


class ExpandingBoxSearchParams(SearchParams):
    """
    Parameters for an expanding box search
    """
    def __init__(self, from_geo, asset_type, creator, sweep_width, iterations, first_bearing):
        # pylint: disable=R0913,R0917
        super().__init__(from_geo, asset_type, creator, sweep_width)
        self._iterations = int(iterations)
        if self._iterations < 1:
            raise ValueError("Iterations must be at least 1")
        self._first_bearing = int(first_bearing)
        if self._first_bearing < 0 or self._first_bearing > 360:
            raise ValueError("First bearing must be between 0 and 360")

    def iterations(self):
        """
        Return the number of complete squares to perform for this search
        """
        return self._iterations

    def first_bearing(self):
        """
        Return the course from the datum to the first point
        """
        return self._first_bearing


class TrackLineCreepingSearchParams(SearchParams):
    """
    Parameters for a track line creeping search
    """
    def __init__(self, from_geo, asset_type, creator, sweep_width, width):
        # pylint: disable=R0913,R0917
        super().__init__(from_geo, asset_type, creator, sweep_width)
        self._width = int(width)
        if self._width < 0:
            raise ValueError("Width must be positive")

    def width(self):
        """
        Return the width across the track to search
        (searching will occur width/2 either side of the track)
        """
        return self._width
