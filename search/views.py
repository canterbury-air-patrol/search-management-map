"""
Define the views for creating and managing searching.

Basic overview of presented API:
- Find a search by asset type
- Accept a search for an asset
- Complete a search
- Abandon/Partially complete a search
- Foreach search type:
 - Create
 - List all incomplete searches
 - List all completed searches
 - Details
"""
import math

from django.http import HttpResponse, HttpResponseForbidden, HttpResponseNotFound, JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db import connection
from django.contrib.gis.geos import GEOSGeometry, LineString
from django.utils import timezone

from assets.models import AssetType, Asset
from data.models import PointTimeLabel, LineStringTimeLabel
from data.view_helpers import to_kml, to_geojson
from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch
from .view_helpers import search_json, search_incomplete, search_completed, check_searches_in_progress


def dictfetchall(cursor):
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


@login_required
def find_closest_search(request):
    """
    Find the geographically closest search for the specified asset.
    """
    if request.method == 'POST':
        asset_id = request.POST.get('asset_id')
        lat = request.POST.get('latitude')
        long = request.POST.get('longitude')
    elif request.method == 'GET':
        asset_id = request.GET.get('asset_id')
        lat = request.GET.get('latitude')
        long = request.GET.get('longitude')
    else:
        HttpResponseNotFound('Unknown Method')

    asset = get_object_or_404(Asset, pk=asset_id)

    object_type = None
    object_id = None
    distance = None
    length = None

    # Search for the closest start point across the search types
    for table in ('sector', 'expandingbox', 'trackline', 'tracklinecreeping'):
        query = \
            "SELECT id,ST_Distance(ST_PointN(line::geometry,1)::geography,'SRID=4326;POINT({} {})'::geography) AS distance, ST_Length(line) AS length" \
            " FROM search_{}search WHERE created_for_id = {} AND inprogress_by_id is NULL AND completed is NULL ORDER BY distance ASC LIMIT 1;".format(long, lat, table, asset.asset_type.pk)
        cursor = connection.cursor()
        cursor.execute(query)
        search_res = dictfetchall(cursor)
        if len(search_res) > 0:
            if object_type is None or search_res[0]['distance'] < distance:
                object_type = table
                object_id = search_res[0]['id']
                distance = search_res[0]['distance']
                length = search_res[0]['length']

    if object_type == 'tracklinecreeping':
        object_type = 'creepingline/track'

    data = {
        'object_url': "/search/{}/{}/json/".format(object_type, object_id),
        'distance': distance,
        'length': length,
    }

    return JsonResponse(data)


def check_search_state(search, action, asset):
    """
    Check the current state of a search and provide
    a suitable error response if it's not suitable for desired action
    """
    if search.deleted:
        return HttpResponseForbidden("Search has been deleted")
    if search.completed is not None or search.completed_by is not None:
        return HttpResponseForbidden("Search already completed")

    if action == 'begin':
        if search.inprogress_by is not None:
            return HttpResponseForbidden("Search already in progress")
    elif action == 'complete':
        if search.inprogress_by is None or search.inprogress_by.id != asset.id:
            return HttpResponseForbidden("Search not in progress by this asset")

    return None


@login_required
def search_begin(request, search_id, object_class):
    """
    An asset has accepted a search

    Mark the search as inprogress with the specified asset
    """
    if request.method == 'POST':
        asset_id = request.POST.get('asset_id')
    elif request.method == 'GET':
        asset_id = request.GET.get('asset_id')
    else:
        return HttpResponse('Unsupported method')

    asset = get_object_or_404(Asset, pk=asset_id)
    if asset.owner != request.user:
        return HttpResponseForbidden("Wrong User for Asset")

    if check_searches_in_progress(asset):
        return HttpResponseForbidden("Asset already has a search in progress.")

    search = get_object_or_404(object_class, pk=search_id)
    error = check_search_state(search, 'begin', asset)
    if error is not None:
        return error

    search.inprogress_by = asset
    search.save()

    return to_geojson(object_class, [search])


@login_required
def search_finished(request, search_id, object_class):
    """
    A search has been completed
    """
    if request.method == 'POST':
        asset_id = request.POST.get('asset_id')
    elif request.method == 'GET':
        asset_id = request.GET.get('asset_id')
    else:
        return HttpResponse('Unsupported method')

    asset = get_object_or_404(Asset, pk=asset_id)
    if asset.owner != request.user:
        return HttpResponseForbidden("Wrong User for Asset")

    search = get_object_or_404(object_class, pk=search_id)
    error = check_search_state(search, 'complete', asset)
    if error is not None:
        return error

    search.completed = timezone.now()
    search.completed_by = asset
    search.save()

    return HttpResponse("Completed")


def sector_search_json(request, search_id):
    """
    Provide the fulls details of a sector search as json
    """
    return search_json(request, search_id, SectorSearch)


@login_required
def sector_search_incomplete(request):
    """
    Get a list of all the incomplete sector searches (as json)
    """
    return to_geojson(SectorSearch, search_incomplete(SectorSearch))


def sector_search_incomplete_kml(request):
    """
    Get a list of all the incomplete sector searches (as kml)
    """
    return to_kml(SectorSearch, search_incomplete(SectorSearch))


@login_required
def sector_search_completed(request):
    """
    Get a list of all the completed sector searches (as json)
    """
    return to_geojson(SectorSearch, search_completed(SectorSearch))


def sector_search_completed_kml(request):
    """
    Get a list of all the completed sector searches (as kml)
    """
    return to_kml(SectorSearch, search_completed(SectorSearch))


def sector_search_begin(request, search_id):
    """
    Begin a sector search
    """
    return search_begin(request, search_id, SectorSearch)


def sector_search_finished(request, search_id):
    """
    Complete a sector search
    """
    return search_finished(request, search_id, SectorSearch)


@login_required
def sector_search_create(request):
    """
    Create a sector search
    """
    save = False
    if request.method == 'POST':
        poi_id = request.POST.get('poi_id')
        asset_type_id = request.POST.get('asset_type_id')
        sweep_width = request.POST.get('sweep_width')
        save = True
    elif request.method == 'GET':
        poi_id = request.GET.get('poi_id')
        asset_type_id = request.GET.get('asset_type_id')
        sweep_width = request.GET.get('sweep_width')
    else:
        HttpResponseNotFound('Unknown Method')

    poi = get_object_or_404(PointTimeLabel, pk=poi_id)
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    # calculate the points on the outside of a circle
    # that are sweep_width * 3 from the poi
    # with angles: 30,60,90,120,150,180,210,240,270,300,330,360
    # this order makes the points in clock-order
    query = "SELECT point"
    for deg in (30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0):
        query += ", ST_Project(point, {sw}, radians({deg})) AS deg_{deg}".format(**{'sw': float(sweep_width) * 3, 'deg': deg})
    query += " FROM data_pointtimelabel WHERE id = {}".format(poi.pk)
    cursor = connection.cursor()
    cursor.execute(query)
    reference_points = cursor.fetchone()

    # Create a SectorSector
    points_order = [0, 12, 2, 8, 10, 4, 6, 0, 1, 3, 9, 11, 5, 7, 0, 2, 4, 10, 12, 6, 8, 0]
    points = []
    for point in points_order:
        points.append(GEOSGeometry(reference_points[point]))

    search = SectorSearch(line=LineString(points), creator=request.user, datum=poi, created_for=asset_type, sweep_width=sweep_width)
    if save:
        search.save()

    return to_geojson(SectorSearch, [search])


def expanding_box_search_json(request, search_id):
    """
    Provide the fulls details of an expanding box search as json
    """
    return search_json(request, search_id, ExpandingBoxSearch)


@login_required
def expanding_box_search_incomplete(request):
    """
    Get a list of all the incomplete expanding box searches (as json)
    """
    return to_geojson(ExpandingBoxSearch, search_incomplete(ExpandingBoxSearch))


def expanding_box_search_incomplete_kml(request):
    """
    Get a list of all the incomplete expanding box searches (as kml)
    """
    return to_kml(ExpandingBoxSearch, search_incomplete(ExpandingBoxSearch))


@login_required
def expanding_box_search_completed(request):
    """
    Get a list of all the completed expanding box searches (as json)
    """
    return to_geojson(ExpandingBoxSearch, search_completed(ExpandingBoxSearch))


def expanding_box_search_completed_kml(request):
    """
    Get a list of all the completed expanding box searches (as kml)
    """
    return to_kml(ExpandingBoxSearch, search_completed(ExpandingBoxSearch))


def expanding_box_search_begin(request, search_id):
    """
    Begin an expanding box search
    """
    return search_begin(request, search_id, ExpandingBoxSearch)


def expanding_box_search_finished(request, search_id):
    """
    Complete an expanding box search
    """
    return search_finished(request, search_id, ExpandingBoxSearch)


@login_required
def expanding_box_search_create(request):
    """
    Create an expanding box search
    """
    save = False
    if request.method == 'POST':
        poi_id = request.POST.get('poi_id')
        asset_type_id = request.POST.get('asset_type_id')
        sweep_width = request.POST.get('sweep_width')
        iterations = request.POST.get('iterations')
        first_bearing = request.POST.get('first_bearing')
        save = True
    elif request.method == 'GET':
        poi_id = request.GET.get('poi_id')
        asset_type_id = request.GET.get('asset_type_id')
        sweep_width = request.GET.get('sweep_width')
        iterations = request.GET.get('iterations')
        first_bearing = request.GET.get('first_bearing')
    else:
        HttpResponseNotFound('Unknown Method')

    poi = get_object_or_404(PointTimeLabel, pk=poi_id)
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    sweep_width = float(sweep_width)
    try:
        first_bearing = int(first_bearing)
    except ValueError:
        first_bearing = 0

    query = "SELECT p.point, p.first"
    for i in range(1, int(iterations) + 1):
        dist = math.sqrt(2) * i * sweep_width
        query += ", ST_Project(p.point, {}, radians({}))".format(dist, 45 + first_bearing)
        query += ", ST_Project(p.point, {}, radians({}))".format(dist, 135 + first_bearing)
        query += ", ST_Project(p.point, {}, radians({}))".format(dist, 225 + first_bearing)
        query += ", ST_Project(p.first, {}, radians({}))".format(dist, 315 + first_bearing)

    query += " FROM (SELECT point, ST_Project(point, {}, radians({})) AS first FROM data_pointtimelabel WHERE id = {}) AS p".format(sweep_width, first_bearing, poi.pk)

    cursor = connection.cursor()
    cursor.execute(query)
    db_points = cursor.fetchone()
    points = []
    for point in db_points:
        points.append(GEOSGeometry(point))

    search = ExpandingBoxSearch(line=LineString(points), creator=request.user, datum=poi, created_for=asset_type, sweep_width=sweep_width, iterations=iterations, first_bearing=first_bearing)
    if save:
        search.save()

    return to_geojson(ExpandingBoxSearch, [search])


def track_line_search_json(request, search_id):
    """
    Provide the fulls details of a track line search as json
    """
    return search_json(request, search_id, TrackLineSearch)


@login_required
def track_line_search_incomplete(request):
    """
    Get a list of all the incomplete trackline searches (as json)
    """
    return to_geojson(TrackLineSearch, search_incomplete(TrackLineSearch))


def track_line_search_incomplete_kml(request):
    """
    Get a list of all the incomplete trackline searches (as kml)
    """
    return to_kml(TrackLineSearch, search_incomplete(TrackLineSearch))


@login_required
def track_line_search_completed(request):
    """
    Get a list of all the completed trackline searches (as json)
    """
    return to_geojson(TrackLineSearch, search_completed(TrackLineSearch))


def track_line_search_completed_kml(request):
    """
    Get a list of all the completed trackline searches (as kml)
    """
    return to_kml(TrackLineSearch, search_completed(TrackLineSearch))


def track_line_search_begin(request, search_id):
    """
    Begin a trackline search
    """
    return search_begin(request, search_id, TrackLineSearch)


def track_line_search_finished(request, search_id):
    """
    Complete a trackline search
    """
    return search_finished(request, search_id, TrackLineSearch)


@login_required
def track_line_search_create(request):
    """
    Create a trackline search
    """
    save = False
    if request.method == 'POST':
        line_id = request.POST.get('line_id')
        asset_type_id = request.POST.get('asset_type_id')
        sweep_width = request.POST.get('sweep_width')
        save = True
    elif request.method == 'GET':
        line_id = request.GET.get('line_id')
        asset_type_id = request.GET.get('asset_type_id')
        sweep_width = request.GET.get('sweep_width')
    else:
        HttpResponseNotFound('Unknown Method')

    line = get_object_or_404(LineStringTimeLabel, pk=line_id)
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    sweep_width = float(sweep_width)

    search = TrackLineSearch(line=line.line, creator=request.user, datum=line, created_for=asset_type, sweep_width=sweep_width)
    if save:
        search.save()

    return to_geojson(TrackLineSearch, [search])


def creeping_line_track_search_json(request, search_id):
    """
    Provide the fulls details of a creeping line ahead search as json
    """
    return search_json(request, search_id, TrackLineCreepingSearch)


@login_required
def creeping_line_track_search_incomplete(request):
    """
    Get a list of all the incomplete creeping line ahead searches (as json)
    """
    return to_geojson(TrackLineCreepingSearch, search_incomplete(TrackLineCreepingSearch))


def creeping_line_track_search_incomplete_kml(request):
    """
    Get a list of all the incomplete creeping line ahead searches (as kml)
    """
    return to_kml(TrackLineCreepingSearch, search_incomplete(TrackLineCreepingSearch))


@login_required
def creeping_line_track_search_completed(request):
    """
    Get a list of all the completed creeping line ahead searches (as json)
    """
    return to_geojson(TrackLineCreepingSearch, search_completed(TrackLineCreepingSearch))


def creeping_line_track_search_completed_kml(request):
    """
    Get a list of all the completed creeping line ahead searches (as kml)
    """
    return to_kml(TrackLineCreepingSearch, search_completed(TrackLineCreepingSearch))


def creeping_line_track_search_begin(request, search_id):
    """
    Begin a creeping line search
    """
    return search_begin(request, search_id, TrackLineCreepingSearch)


def creeping_line_track_search_finished(request, search_id):
    """
    Complete a creeping line search
    """
    return search_finished(request, search_id, TrackLineCreepingSearch)


@login_required
def track_creeping_line_search_create(request):
    """
    Create a creeping line ahead search (from a line)
    """
    save = False
    if request.method == 'POST':
        line_id = request.POST.get('line_id')
        asset_type_id = request.POST.get('asset_type_id')
        sweep_width = request.POST.get('sweep_width')
        width = request.POST.get('width')
        save = True
    elif request.method == 'GET':
        line_id = request.GET.get('line_id')
        asset_type_id = request.GET.get('asset_type_id')
        sweep_width = request.GET.get('sweep_width')
        width = request.GET.get('width')
    else:
        HttpResponseNotFound('Unknown Method')

    line = get_object_or_404(LineStringTimeLabel, pk=line_id)
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    sweep_width = float(sweep_width)

    segment_query = \
        "SELECT ST_PointN(line::geometry, pos)::geography AS start, ST_PointN(line::geometry, pos + 1)::geography AS end" \
        " FROM data_linestringtimelabel, generate_series(1, ST_NPoints(line::geometry) - 1) AS pos WHERE id = {}".format(line.pk)

    line_data_query = \
        "SELECT segment.start AS start, ST_Azimuth(segment.start, segment.end) AS direction, ST_Distance(segment.start, segment.end) AS distance FROM ({}) AS segment".format(segment_query)
    line_points_query = \
        "SELECT direction AS direction, ST_Project(linedata.start, {0} * i, direction) AS point"\
        " FROM ({1}) AS linedata, generate_series(0, (linedata.distance/{0})::integer) AS i".format(sweep_width, line_data_query)
    query = \
        "SELECT ST_Project(point, {0}, direction + PI()/2) AS A, ST_Project(point, {0}, direction - PI()/2) AS B FROM ({1}) AS linepoints;".format(width, line_points_query)

    cursor = connection.cursor()
    cursor.execute(query)
    db_points = dictfetchall(cursor)

    points = []
    reverse = False
    for segment in db_points:
        if reverse:
            points.append(GEOSGeometry(segment['b']))
            points.append(GEOSGeometry(segment['a']))
            reverse = False
        else:
            points.append(GEOSGeometry(segment['a']))
            points.append(GEOSGeometry(segment['b']))
            reverse = True

    search = TrackLineCreepingSearch(line=LineString(points), creator=request.user, datum=line, created_for=asset_type, sweep_width=sweep_width, width=width)
    if save:
        search.save()

    return to_geojson(TrackLineCreepingSearch, [search])
