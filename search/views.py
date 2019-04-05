from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
from django.db import connection
from django.contrib.gis.geos import GEOSGeometry, LineString

import math

from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch
from data.models import PointTimeLabel, LineStringTimeLabel
from assets.models import AssetType


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
    except:
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
