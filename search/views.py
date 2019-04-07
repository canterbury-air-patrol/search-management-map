from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
from django.db import connection
from django.contrib.gis.geos import GEOSGeometry, LineString

import math
import json

from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch
from data.models import PointTimeLabel, LineStringTimeLabel
from assets.models import AssetType, Asset


def dictfetchall(cursor):
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


@login_required
def find_closest_search(request):
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
        query = "SELECT id,ST_Distance(ST_PointN(line::geometry,1)::geography,'SRID=4326;POINT({} {})'::geography) AS distance, ST_Length(line) AS length FROM search_{}search WHERE created_for_id = {} AND completed is NULL ORDER BY distance ASC LIMIT 1;".format(long, lat, table, asset.asset_type.pk)
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

    return HttpResponse(json.dumps(data), content_type='application/json')


@login_required
def search_json(request, id, objectClass):
    search = get_object_or_404(objectClass, pk=id)
    geojson_data = serialize('geojson', [search], geometry_field='line',
                             fields=objectClass.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


def sector_search_json(request, id):
    return search_json(request, id, SectorSearch)


@login_required
def sector_search_incomplete(request):
    sector_searches = SectorSearch.objects.exclude(deleted=True).exclude(completed__isnull=False)

    geojson_data = serialize('geojson', sector_searches, geometry_field='line',
                             fields=SectorSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def sector_search_completed(request):
    sector_searches = SectorSearch.objects.exclude(deleted=True).exclude(completed__isnull=True)

    geojson_data = serialize('geojson', sector_searches, geometry_field='line',
                             fields=SectorSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def sector_search_create(request):
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
    for p in points_order:
        points.append(GEOSGeometry(reference_points[p]))

    ss = SectorSearch(line=LineString(points), creator=request.user, datum=poi, created_for=asset_type, sweep_width=sweep_width)
    if save:
        ss.save()

    geojson_data = serialize('geojson', [ss], geometry_field='line',
                             fields=SectorSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


def expanding_box_search_json(request, id):
    return search_json(request, id, ExpandingBoxSearch)


@login_required
def expanding_box_search_incomplete(request):
    sector_searches = ExpandingBoxSearch.objects.exclude(deleted=True).exclude(completed__isnull=False)

    geojson_data = serialize('geojson', sector_searches, geometry_field='line',
                             fields=ExpandingBoxSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def expanding_box_search_completed(request):
    sector_searches = ExpandingBoxSearch.objects.exclude(deleted=True).exclude(completed__isnull=True)

    geojson_data = serialize('geojson', sector_searches, geometry_field='line',
                             fields=ExpandingBoxSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def expanding_box_search_create(request):
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
        len = math.sqrt(2) * i * sweep_width
        query += ", ST_Project(p.point, {}, radians({}))".format(len, 45 + first_bearing)
        query += ", ST_Project(p.point, {}, radians({}))".format(len, 135 + first_bearing)
        query += ", ST_Project(p.point, {}, radians({}))".format(len, 225 + first_bearing)
        query += ", ST_Project(p.first, {}, radians({}))".format(len, 315 + first_bearing)

    query += " FROM (SELECT point, ST_Project(point, {}, radians({})) AS first FROM data_pointtimelabel WHERE id = {}) AS p".format(sweep_width, first_bearing, poi.pk)

    cursor = connection.cursor()
    cursor.execute(query)
    db_points = cursor.fetchone()
    points = []
    for p in db_points:
        points.append(GEOSGeometry(p))

    eb = ExpandingBoxSearch(line=LineString(points), creator=request.user, datum=poi, created_for=asset_type, sweep_width=sweep_width, iterations=iterations, first_bearing=first_bearing)
    if save:
        eb.save()

    geojson_data = serialize('geojson', [eb], geometry_field='line',
                             fields=ExpandingBoxSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


def track_line_search_json(request, id):
    return search_json(request, id, TrackLineSearch)


@login_required
def track_line_search_incomplete(request):
    searches = TrackLineSearch.objects.exclude(deleted=True).exclude(completed__isnull=False)

    geojson_data = serialize('geojson', searches, geometry_field='line',
                             fields=TrackLineSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def track_line_search_completed(request):
    searches = TrackLineSearch.objects.exclude(deleted=True).exclude(completed__isnull=True)

    geojson_data = serialize('geojson', searches, geometry_field='line',
                             fields=TrackLineSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def track_line_search_create(request):
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

    tl = TrackLineSearch(line=line.line, creator=request.user, datum=line, created_for=asset_type, sweep_width=sweep_width)
    if save:
        tl.save()

    geojson_data = serialize('geojson', [tl], geometry_field='line',
                             fields=TrackLineSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


def creeping_line_track_search_json(request, id):
    return search_json(request, id, TrackLineCreepingSearch)


@login_required
def creeping_line_search_incomplete(request):
    searches = TrackLineCreepingSearch.objects.exclude(deleted=True).exclude(completed__isnull=False)

    geojson_data = serialize('geojson', searches, geometry_field='line',
                             fields=TrackLineCreepingSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def creeping_line_search_completed(request):
    searches = TrackLineCreepingSearch.objects.exclude(deleted=True).exclude(completed__isnull=True)

    geojson_data = serialize('geojson', searches, geometry_field='line',
                             fields=TrackLineCreepingSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def track_creeping_line_search_create(request):
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

    segment_query = "SELECT ST_PointN(line::geometry, pos)::geography AS start, ST_PointN(line::geometry, pos + 1)::geography AS end FROM data_linestringtimelabel, generate_series(1, ST_NPoints(line::geometry) - 1) AS pos WHERE id = {}".format(line.pk)
    line_data_query = "SELECT segment.start AS start, ST_Azimuth(segment.start, segment.end) AS direction, ST_Distance(segment.start, segment.end) AS distance FROM ({}) AS segment".format(segment_query)
    line_points_query = "SELECT direction AS direction, ST_Project(linedata.start, {} * i, direction) AS point FROM ({}) AS linedata, generate_series(0, (linedata.distance/{})::integer) AS i".format(sweep_width, line_data_query, sweep_width)
    query = "SELECT ST_Project(point, {}, direction + PI()/2) AS A, ST_Project(point, {}, direction - PI()/2) AS B FROM ({}) AS linepoints;".format(width, width, line_points_query)

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

    geojson_data = serialize('geojson', [search], geometry_field='line',
                             fields=TrackLineCreepingSearch.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')
