from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point, Polygon, LineString
from django.core.serializers import serialize
from django.shortcuts import get_object_or_404, render
from django.utils import timezone

from io import TextIOWrapper
import csv
import pytz
from datetime import datetime

from assets.models import Asset
from .models import AssetPointTime, PointTime, PointTimeLabel, PolygonTimeLabel, LineStringTimeLabel
from .forms import UploadTyphoonData
from .view_helpers import *
from smm.settings import TIME_ZONE


@login_required
def assets_position_latest(request):
    assets = Asset.objects.all()
    positions = []
    for a in assets:
        points = AssetPointTime.objects.filter(asset=a).order_by('-timestamp')[:1]
        for p in points:
            positions.append(p)

    geojson_data = serialize('geojson', positions, geometry_field='point',
                             fields=AssetPointTime.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def asset_record_position(request, asset_name):
    print('name={}'.format(asset_name))
    asset = get_object_or_404(Asset, name=asset_name)
    if asset.owner != request.user:
        Http404("Wrong User for Asset")

    msg = "Success"
    lat = ''
    lon = ''
    fix = None
    alt = None
    heading = None

    if request.method == 'GET':
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        fix = request.GET.get('fix')
        alt = request.GET.get('alt')
        heading = request.GET.get('heading')
    elif request.method == 'POST':
        lat = request.POST.get('lat')
        lon = request.POST.get('lon')
        fix = request.POST.get('fix')
        alt = request.POST.get('alt')
        heading = request.POST.get('heading')
    else:
        msg = request.method

    p = None
    try:
        p = Point(float(lon), float(lat))
    except (ValueError, TypeError):
        pass

    try:
        fix = int(fix)
    except (TypeError, ValueError):
        fix = None
    try:
        heading = int(heading)
    except (TypeError, ValueError):
        heading = None
    try:
        alt = float(alt)
    except (TypeError, ValueError):
        alt = None

    if p:
        AssetPointTime(asset=asset, point=p, creator=request.user, alt=alt, heading=heading, fix=fix).save()
    if not p:
        msg = ("Invalid lat/lon (%s,%s)" % (lat, lon))

    return HttpResponse(msg)


@login_required
def asset_position_history(request, asset_name):
    asset = get_object_or_404(Asset, name=asset_name)

    # TODO: filter by date/time
    positions = AssetPointTime.objects.filter(asset=asset).order_by('-timestamp')

    geojson_data = serialize('geojson', positions, geometry_field='point',
                             fields=AssetPointTime.GEOJSON_FIELDS)

    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def point_labels_all(request):
    return to_geojson(PointTimeLabel, userobject_not_deleted_or_replaced(PointTimeLabel))


@login_required
def point_label_create(request):
    return point_label_make(request)


@login_required
def point_label_replace(request, pk):
    return userobject_replace(PointTimeLabel, request, 'POI', pk, point_label_make)


@login_required
def point_label_delete(request, pk):
    return userobject_delete(PointTimeLabel, request, 'POI', pk)


@login_required
def user_polygons_all(request):
    return to_geojson(PolygonTimeLabel, userobject_not_deleted_or_replaced(PolygonTimeLabel))


@login_required
def user_polygon_create(request):
    return user_polygon_make(request)


@login_required
def user_polygon_replace(request, pk):
    return userobject_replace(PolygonTimeLabel, request, 'Polygon', pk, user_polygon_make)


@login_required
def user_polygon_delete(request, pk):
    return userobject_delete(PolygonTimeLabel, request, 'Polygon', pk)


@login_required
def user_lines_all(request):
    return to_geojson(LineStringTimeLabel, userobject_not_deleted_or_replaced(LineStringTimeLabel))


@login_required
def user_line_create(request):
    return user_line_make(request)


@login_required
def user_line_replace(request, pk):
    return userobject_replace(LineStringTimeLabel, request, 'Line', pk, user_line_make)


@login_required
def user_line_delete(request, pk):
    return userobject_delete(LineStringTimeLabel, request, 'Line', pk)


def convert_typhoon_time(ts):
    a = ts.split(' ')
    date = a[0]
    year = int(date[0:4])
    month = int(date[4:6])
    day = int(date[6:8])
    time = a[1].split(':')
    hour = int(time[0])
    min = int(time[1])
    sec = int(time[2])
    msecs = int(time[3])
    return datetime(year, month, day, hour, min, sec, msecs, tzinfo=pytz.timezone(TIME_ZONE)), sec


@login_required
def upload_typhoonh_data(request):
    if request.method == 'POST':
        form = UploadTyphoonData(request.POST, request.FILES)
        if form.is_valid():
            with TextIOWrapper(request.FILES['telemetry'].file, encoding=request.encoding) as f:
                reader = csv.DictReader(f)
                last_second = -1
                for row in reader:
                    if row['gps_used'] == 'true':
                        p = Point(float(row['longitude']), float(row['latitude']))
                        timestring, seconds = convert_typhoon_time(row[''])
                        if seconds != last_second:
                            AssetPointTime(asset=form.cleaned_data['asset'], alt=float(row['altitude']), heading=float(row['yaw']), point=p, timestamp=timestring, creator=request.user).save()
                            last_second = seconds
            return HttpResponseRedirect('/')
    else:
        form = UploadTyphoonData()

    form.fields['asset'].queryset = Asset.objects.filter(owner=request.user)

    return render(request, 'typhoon-upload.html', {'form': form})
