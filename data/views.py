"""
Views for map data

These views mostly cover the data that users can create/edit on the map.
Also, the asset tracks are handled here too.
"""

from io import TextIOWrapper
import csv
from datetime import datetime
import pytz

from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404, render

from smm.settings import TIME_ZONE
from assets.models import Asset, AssetCommand
from assets.decorators import asset_is_recorder
from mission.decorators import mission_is_member, mission_asset_get
from mission.models import Mission
from .models import AssetPointTime, GeoTimeLabel
from .forms import UploadTyphoonData
from .view_helpers import to_geojson, to_kml, point_label_make, user_polygon_make, user_line_make, geotimelabel_replace, geotimelabel_delete


def mission_get(mission_id):
    """
    Convert a mission id into an object
    """
    return get_object_or_404(Mission, pk=mission_id)


@login_required
@mission_is_member
def assets_position_latest(request, mission_user):
    """
    Get the last position of each of the know assets
    """
    assets = Asset.objects.all()
    positions = []
    for asset in assets:
        points = AssetPointTime.objects.filter(mission=mission_user.mission, asset=asset).order_by('-created_at')[:1]
        for point in points:
            positions.append(point)

    return to_geojson(AssetPointTime, positions)


@login_required
def assets_position_latest_user(request, current_only):
    """
    Get the last position of each of the know assets from all missions
    """
    assets = Asset.objects.all()
    positions = []
    for asset in assets:
        points = AssetPointTime.objects
        if current_only:
            points = points.filter(mission__closed__isnull=True)
        points = points.filter(mission__missionuser__user=request.user, asset=asset).order_by('-created_at')[:1]
        for point in points:
            positions.append(point)

    return to_geojson(AssetPointTime, positions)


@login_required
@asset_is_recorder
def asset_record_position(request, asset):
    """
    Record the current position of an asset.

    Only allows recording of the assets position by the owner.
    Accepts get requests because some assets are very basic.

    Return the last command that applies to an object
    """
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

    mission_asset = mission_asset_get(asset)
    if mission_asset is not None:
        if point:
            AssetPointTime(asset=asset, geo=point, created_by=request.user, alt=alt, heading=heading, fix=fix, mission=mission_asset.mission).save()
        else:
            return HttpResponseBadRequest("Invalid lat/lon")

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


def asset_position_history(request, asset_name, mission=None, user=None, current_only=False):
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

    positions = AssetPointTime.objects
    if mission is not None:
        positions = positions.filter(mission=mission)
    elif user is not None:
        positions = positions.filter(mission__missionuser__user=user)
        if current_only:
            positions = positions.filter(mission__closed__isnull=True)
    positions = positions.filter(asset=asset)
    if since is not None:
        positions = positions.filter(created_at__gt=since)
    if oldest == 'last':
        positions = positions.order_by('created_at')
    else:
        positions = positions.order_by('-created_at')

    return to_geojson(AssetPointTime, positions)


@login_required
@mission_is_member
def asset_position_history_mission(request, mission_user, asset_name):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    return asset_position_history(request, asset_name, mission=mission_user.mission)


@login_required
def asset_position_history_user(request, asset_name, current_only):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    return asset_position_history(request, asset_name, user=request.user, current_only=current_only)


@login_required
@mission_is_member
def data_all_specific_mission_type(request, mission_user, geo_type):
    """
    Get all the current (geo_type)s as geojson from the specified mission
    """
    return to_geojson(GeoTimeLabel, GeoTimeLabel.all_current_of_geo(mission_user.mission, geo_type=geo_type))


@login_required
def data_all_all_missions_type(request, geo_type):
    """
    Get all current (geo_type)s from all missions this user is in
    """
    return to_geojson(GeoTimeLabel, GeoTimeLabel.all_current_of_geo_user(request.user, geo_type))


@login_required
def data_all_current_missions_type(request, geo_type):
    """
    Get all current (geo_type)s from all missions this user is in
    """
    return to_geojson(GeoTimeLabel, GeoTimeLabel.all_current_of_geo_user(request.user, geo_type, current_only=True))


@login_required
@mission_is_member
def usergeo_details(request, geo_type, geo_id, mission_user):
    """
    Show details of a single (geo_type)
    """
    usergeo = get_object_or_404(GeoTimeLabel, id=geo_id, mission=mission_user.mission, geo_type=geo_type)
    usergeo_url = ''
    if geo_type == 'poi':
        usergeo_url = 'pois'
    elif geo_type == 'line':
        usergeo_url = 'userlines'
    elif geo_type == 'polygon':
        usergeo_url = 'userpolygons'

    return render(request, 'data/usergeo_details.html', {'userGeoId': usergeo.pk, 'missionId': mission_user.mission.pk, 'userGeoType': usergeo_url})


@login_required
@mission_is_member
def usergeo_json(request, geo_type, geo_id, mission_user):
    """
    Get a (geo_type) object and return it as geojson
    """
    usergeo = get_object_or_404(GeoTimeLabel, pk=geo_id, mission=mission_user.mission, geo_type=geo_type)
    return to_geojson(GeoTimeLabel, [usergeo])


def point_labels_all_kml(request, mission_id):
    """
    Get all the current POIs as kml
    """
    mission = mission_get(mission_id)
    return to_kml(GeoTimeLabel, GeoTimeLabel.all_current_of_geo(mission.mission, geo_type='poi'))


@login_required
@mission_is_member
def point_label_create(request, mission_user):
    """
    Store a new POI
    """
    return point_label_make(request, mission=mission_user.mission)


@login_required
@mission_is_member
def point_label_replace(request, mission_user, poi):
    """
    Move/relabel a POI
    """
    return geotimelabel_replace(request, 'POI', poi, 'poi', mission_user.mission, point_label_make)


@login_required
@mission_is_member
def point_label_delete(request, mission_user, poi):
    """
    Delete a POI
    """
    return geotimelabel_delete(request, 'POI', poi, 'poi', mission_user)


def user_polygons_all_kml(request, mission_id):
    """
    Get all the current user polygons as kml
    """
    mission = mission_get(mission_id)
    return to_kml(GeoTimeLabel, GeoTimeLabel.all_current_of_geo(mission, geo_type='polygon'))


@login_required
@mission_is_member
def user_polygon_create(request, mission_user):
    """
    Create a new user polygon
    """
    return user_polygon_make(request, mission=mission_user.mission)


@login_required
@mission_is_member
def user_polygon_replace(request, mission_user, polygon):
    """
    Update the polygon/label of a user polygon
    """
    return geotimelabel_replace(request, 'Polygon', polygon, 'polygon', mission_user.mission, user_polygon_make)


@login_required
@mission_is_member
def user_polygon_delete(request, mission_user, polygon):
    """
    Delete a user polygon
    """
    return geotimelabel_delete(request, 'Polygon', polygon, 'polygon', mission_user)


def user_lines_all_kml(request, mission_id):
    """
    Get all the current user lines as kml
    """
    mission = mission_get(mission_id)
    return to_kml(GeoTimeLabel, GeoTimeLabel.all_current_of_geo(mission, geo_type='line'))


@login_required
@mission_is_member
def user_line_create(request, mission_user):
    """
    Create a new user line
    """
    return user_line_make(request, mission=mission_user.mission)


@login_required
@mission_is_member
def user_line_replace(request, mission_user, line):
    """
    Update the line/label of a user line
    """
    return geotimelabel_replace(request, 'Line', line, 'line', mission_user.mission, user_line_make)


@login_required
@mission_is_member
def user_line_delete(request, mission_user, line):
    """
    Delete a user line
    """
    return geotimelabel_delete(request, 'Line', line, 'line', mission_user)


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
@mission_is_member
def upload_typhoonh_data(request, mission_user):
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
                            AssetPointTime(asset=form.cleaned_data['asset'], alt=float(row['altitude']), heading=float(row['yaw']), point=point, created_at=timestring, created_by=mission_user.user).save()
                            last_second = seconds
            return HttpResponseRedirect('/')
    else:
        form = UploadTyphoonData()

    form.fields['asset'].queryset = Asset.objects.filter(owner=request.user)

    return render(request, 'typhoon-upload.html', {'form': form})
