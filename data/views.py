"""
Views for map data

These views mostly cover the data that users can create/edit on the map.
Also, the asset tracks are handled here too.
"""


import contextlib
from io import TextIOWrapper
import csv
from datetime import datetime
import pytz

from django.http import HttpResponse, HttpResponseRedirect, HttpResponseBadRequest, JsonResponse, HttpResponseNotFound
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404, render
from django.utils.decorators import method_decorator
from django.views import View

from smm.settings import TIME_ZONE
from assets.models import Asset, AssetCommand
from assets.decorators import asset_is_recorder
from mission.decorators import mission_is_member, mission_asset_get
from mission.models import Mission
from .decorators import geotimelabel_from_type_id, geotimelabel_from_id, data_get_mission_id
from .models import AssetPointTime, GeoTimeLabel, UserPointTime
from .forms import UploadTyphoonData
from .view_helpers import to_geojson, to_kml, point_label_make, user_polygon_make, user_line_make, geotimelabel_replace


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
        positions.extend(iter(points))
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
        positions.extend(iter(points))
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
        return HttpResponseBadRequest("Unsupported method")

    point = None
    with contextlib.suppress(ValueError, TypeError):
        point = Point(float(lon), float(lat))
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

        return JsonResponse(AssetCommand.last_command_for_asset_to_json(asset))

    return HttpResponse("Continue")


def asset_position_history(request, asset_id, mission=None, user=None, current_only=False):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    oldest = 'first'
    since = None
    if request.method == 'GET':
        since = request.GET.get('from')
        if request.GET.get('oldest'):
            oldest = request.GET.get('oldest')

    asset = get_object_or_404(Asset, pk=asset_id)

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
def asset_position_history_mission(request, mission_user, asset_id):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    return asset_position_history(request, asset_id, mission=mission_user.mission)


@login_required
def asset_position_history_user(request, asset_id, current_only):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    return asset_position_history(request, asset_id, user=request.user, current_only=current_only)


@login_required
@mission_is_member
def users_position_latest(request, mission_user):
    """
    Get the last position of each of the know assets
    """
    users = get_user_model().objects.all()
    positions = []
    for user in users:
        points = UserPointTime.objects.filter(mission=mission_user.mission, user=user).order_by('-created_at')[:1]
        positions.extend(iter(points))
    return to_geojson(UserPointTime, positions)


@login_required
def users_position_latest_user(request, current_only):
    """
    Get the last position of each of the know assets from all missions
    """
    users = get_user_model().objects.all()
    positions = []
    for user in users:
        points = UserPointTime.objects
        if current_only:
            points = points.filter(mission__closed__isnull=True)
        points = points.filter(mission__missionuser__user=request.user, user=user).order_by('-created_at')[:1]
        positions.extend(iter(points))
    return to_geojson(UserPointTime, positions)


@login_required
@mission_is_member
def user_record_position(request, mission_user, user):
    """
    Record the current position of a user.

    Only allows recording of the assets position by the owner.
    """
    lat = ''
    lon = ''
    fix = None
    alt = None
    heading = None

    if request.user.username != user:
        return HttpResponse('Unauthorized', status=401)

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
        return HttpResponseBadRequest("Unsupported method")

    point = None
    with contextlib.suppress(ValueError, TypeError):
        point = Point(float(lon), float(lat))
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
        UserPointTime(user=request.user, geo=point, created_by=request.user, alt=alt, mission=mission_user.mission).save()
    else:
        return HttpResponseBadRequest("Invalid lat/lon")

    return HttpResponse("Okay")


def user_position_history(request, user, mission=None, requesting_user=None, current_only=False):
    """
    Get the full track from an asset.

    When from is provided, only points after the timestamp from are considered.
    """
    oldest = 'first'
    since = None
    if request.method == 'GET':
        since = request.GET.get('from')
        if request.GET.get('oldest'):
            oldest = request.GET.get('oldest')

    user_object = get_object_or_404(get_user_model(), username=user)

    positions = UserPointTime.objects
    if mission is not None:
        positions = positions.filter(mission=mission)
    elif requesting_user is not None:
        positions = positions.filter(mission__missionuser__user=requesting_user)
        if current_only:
            positions = positions.filter(mission__closed__isnull=True)
    positions = positions.filter(user=user_object)
    if since is not None:
        positions = positions.filter(created_at__gt=since)
    if oldest == 'last':
        positions = positions.order_by('created_at')
    else:
        positions = positions.order_by('-created_at')

    return to_geojson(UserPointTime, positions)


@login_required
@mission_is_member
def user_position_history_mission(request, mission_user, user):
    """
    Get the full track from a user.
    In a specific mission.

    When from is provided, only points after the timestamp from are considered.
    """
    return user_position_history(request, user, mission=mission_user.mission)


@login_required
def user_position_history_user(request, user, current_only):
    """
    Get the full track for a user.
    Across all (current) missions.

    When from is provided, only points after the timestamp from are considered.
    """
    return user_position_history(request, user, requesting_user=request.user, current_only=current_only)


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
@geotimelabel_from_type_id
@data_get_mission_id(arg_name='usergeo')
@mission_is_member
def point_label_replace(request, mission_user, usergeo):
    """
    Move/relabel a POI
    """
    return geotimelabel_replace(request, 'POI', usergeo, mission_user.mission, point_label_make)


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
@geotimelabel_from_type_id
@data_get_mission_id(arg_name='usergeo')
@mission_is_member
def user_polygon_replace(request, mission_user, usergeo):
    """
    Update the polygon/label of a user polygon
    """
    return geotimelabel_replace(request, 'Polygon', usergeo, mission_user.mission, user_polygon_make)


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
@geotimelabel_from_type_id
@data_get_mission_id(arg_name='usergeo')
@mission_is_member
def user_line_replace(request, mission_user, usergeo):
    """
    Update the line/label of a user line
    """
    return geotimelabel_replace(request, 'Line', usergeo, mission_user.mission, user_line_make)


@method_decorator(login_required, name="dispatch")
@method_decorator(geotimelabel_from_id, name="dispatch")
@method_decorator(data_get_mission_id(arg_name='usergeo'), name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class GeoDataView(View):
    """
    View of mission data
    """
    def as_json(self, request, usergeo):
        """
        Return the geo data as an object
        """
        return to_geojson(GeoTimeLabel, [usergeo])

    def get(self, request, usergeo, mission_user):
        """
        Get the geo data
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request, usergeo)
        return render(request, "data/usergeo_details.html", {'userGeoId': usergeo.pk, 'missionId': mission_user.mission.pk})

    def delete(self, request, usergeo, mission_user):
        """
        Delete this geo data from the mission
        """
        if not usergeo.delete(mission_user.user):
            if usergeo.deleted_at:
                return HttpResponseNotFound(f"This {usergeo.human_type()} has already been deleted")
            if usergeo.replaced_by is not None:
                return HttpResponseNotFound(f"This {usergeo.human_type()} has been replaced")
        return HttpResponse("Deleted")


def convert_typhoon_time(timestamp):
    """
    Convert the time format the typhoon H produces to one we can store.
    The timezone of the data is assumed to be the currently configured one.
    """
    parts = timestamp.split(' ')
    date = parts[0]
    year = int(date[:4])
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
