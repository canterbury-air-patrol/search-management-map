"""
Views for map data

These views mostly cover the data that users can create/edit on the map.
Also, the asset tracks are handled here too.
"""

from io import TextIOWrapper
import csv
from datetime import datetime
import pytz

from django.http import HttpResponse, Http404, HttpResponseRedirect, HttpResponseBadRequest, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404, render

from smm.settings import TIME_ZONE
from assets.models import Asset, AssetCommand
from .models import AssetPointTime, PointTimeLabel, PolygonTimeLabel, LineStringTimeLabel
from .forms import UploadTyphoonData
from .view_helpers import to_geojson, to_kml, userobject_not_deleted_or_replaced, point_label_make, user_polygon_make, user_line_make, userobject_replace, userobject_delete


@login_required
def assets_position_latest(request):
    """
    Get the last position of each of the know assets
    """
    assets = Asset.objects.all()
    positions = []
    for asset in assets:
        points = AssetPointTime.objects.filter(asset=asset).order_by('-timestamp')[:1]
        for point in points:
            positions.append(point)

    return to_geojson(AssetPointTime, positions)


@login_required
def asset_record_position(request, asset_name):
    """
    Record the current position of an asset.

    Only allows recording of the assets position by the owner.
    Accepts get requests because some assets are very basic.

    Return the last command that applies to an object
    """
    asset = get_object_or_404(Asset, name=asset_name)
    if asset.owner != request.user:
        Http404("Wrong User for Asset")

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
        return HttpResponseBadRequest("Unsupport method")

    point = None
    try:
        point = Point(float(lon), float(lat))
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

    if point:
        AssetPointTime(asset=asset, point=point, creator=request.user, alt=alt, heading=heading, fix=fix).save()
    else:
        return HttpResponseBadRequest("Invalid lat/lon (%s,%s)" % (lat, lon))

    asset_command = AssetCommand.last_command_for_asset(asset)
    if asset_command:
        data = {
            'action': asset_command.command,
            'action_txt': asset_command.get_command_display(),
            'reason': asset_command.reason,
            'issued': asset_command.issued,
        }
        if asset_command.position:
            data['latitude'] = asset_command.position.y
            data['longitude'] = asset_command.position.x
        return JsonResponse(data)

    return HttpResponse("Continue")


@login_required
def asset_position_history(request, asset_name):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    oldest = 'first'
    if request.method == 'GET':
        since = request.GET.get('from')
        if request.GET.get('oldest'):
            oldest = request.GET.get('oldest')

    asset = get_object_or_404(Asset, name=asset_name)

    positions = AssetPointTime.objects.filter(asset=asset)
    if since is not None:
        positions = positions.filter(timestamp__gt=since)
    if oldest == 'last':
        positions = positions.order_by('timestamp')
    else:
        positions = positions.order_by('-timestamp')

    return to_geojson(AssetPointTime, positions)


@login_required
def point_labels_all(request):
    """
    Get all the current POIs as geojson
    """
    return to_geojson(PointTimeLabel, userobject_not_deleted_or_replaced(PointTimeLabel))


def point_labels_all_kml(request):
    """
    Get all the current POIs as kml
    """
    return to_kml(PointTimeLabel, userobject_not_deleted_or_replaced(PointTimeLabel))


@login_required
def point_label_create(request):
    """
    Store a new POI
    """
    return point_label_make(request)


@login_required
def point_label_replace(request, poi):
    """
    Move/relabel a POI
    """
    return userobject_replace(PointTimeLabel, request, 'POI', poi, point_label_make)


@login_required
def point_label_delete(request, poi):
    """
    Delete a POI
    """
    return userobject_delete(PointTimeLabel, request, 'POI', poi)


@login_required
def user_polygons_all(request):
    """
    Get all the current user polygons as geojson
    """
    return to_geojson(PolygonTimeLabel, userobject_not_deleted_or_replaced(PolygonTimeLabel))


def user_polygons_all_kml(request):
    """
    Get all the current user polygons as kml
    """
    return to_kml(PolygonTimeLabel, userobject_not_deleted_or_replaced(PolygonTimeLabel))


@login_required
def user_polygon_create(request):
    """
    Create a new user polygon
    """
    return user_polygon_make(request)


@login_required
def user_polygon_replace(request, polygon):
    """
    Update the polygon/label of a user polygon
    """
    return userobject_replace(PolygonTimeLabel, request, 'Polygon', polygon, user_polygon_make)


@login_required
def user_polygon_delete(request, polygon):
    """
    Delete a user polygon
    """
    return userobject_delete(PolygonTimeLabel, request, 'Polygon', polygon)


@login_required
def user_lines_all(request):
    """
    Get all the current user lines as geojson
    """
    return to_geojson(LineStringTimeLabel, userobject_not_deleted_or_replaced(LineStringTimeLabel))


def user_lines_all_kml(request):
    """
    Get all the current user lines as kml
    """
    return to_kml(LineStringTimeLabel, userobject_not_deleted_or_replaced(LineStringTimeLabel))


@login_required
def user_line_create(request):
    """
    Create a new user line
    """
    return user_line_make(request)


@login_required
def user_line_replace(request, line):
    """
    Update the line/label of a user line
    """
    return userobject_replace(LineStringTimeLabel, request, 'Line', line, user_line_make)


@login_required
def user_line_delete(request, line):
    """
    Delete a user line
    """
    return userobject_delete(LineStringTimeLabel, request, 'Line', line)


def convert_typhoon_time(timestamp):
    """
    Convert the time format the typhoon H produces to one we can store.
    The timezone of the data is assumed to be the currently configured one.
    """
    parts = timestamp.split(' ')
    date = parts[0]
    year = int(date[0:4])
    month = int(date[4:6])
    day = int(date[6:8])
    time = parts[1].split(':')
    hour = int(time[0])
    minute = int(time[1])
    sec = int(time[2])
    msecs = int(time[3])
    return datetime(year, month, day, hour, minute, sec, msecs, tzinfo=pytz.timezone(TIME_ZONE)), sec


@login_required
def upload_typhoonh_data(request):
    """
    Allow the user to upload a telemetry from a Typhoon H to create
    the asset track.

    Uses the time from the telemetry file, and presents the form for
    uploading if insufficient data was supplied.

    Limits the selectable assets to those owned by the current user.
    """
    if request.method == 'POST':
        form = UploadTyphoonData(request.POST, request.FILES)
        if form.is_valid():
            with TextIOWrapper(request.FILES['telemetry'].file, encoding=request.encoding) as file:
                reader = csv.DictReader(file)
                last_second = -1
                for row in reader:
                    if row['gps_used'] == 'true':
                        point = Point(float(row['longitude']), float(row['latitude']))
                        timestring, seconds = convert_typhoon_time(row[''])
                        if seconds != last_second:
                            AssetPointTime(asset=form.cleaned_data['asset'], alt=float(row['altitude']), heading=float(row['yaw']), point=point, timestamp=timestring, creator=request.user).save()
                            last_second = seconds
            return HttpResponseRedirect('/')
    else:
        form = UploadTyphoonData()

    form.fields['asset'].queryset = Asset.objects.filter(owner=request.user)

    return render(request, 'typhoon-upload.html', {'form': form})
