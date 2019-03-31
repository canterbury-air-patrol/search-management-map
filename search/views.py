from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
from django.db import connection
from django.contrib.gis.geos import GEOSGeometry, LineString

from .models import SectorSearch
from data.models import PointTimeLabel
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
    if request.method == 'POST':
        poi_id = request.POST.get('poi_id')
        asset_type_id = request.POST.get('asset_type_id')
        sweep_width = reqeust.POST.get('sweep_width')
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
    ss.save()
    return HttpResponse("Created")
