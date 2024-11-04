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
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseNotFound, JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View

from assets.models import AssetType, Asset
from assets.decorators import asset_id_in_get_post
from data.decorators import data_get_mission_id
from data.models import GeoTimeLabel
from data.view_helpers import to_kml, to_geojson
from mission.models import Mission, MissionAsset
from mission.decorators import mission_is_member, mission_asset_get_mission
from timeline.helpers import timeline_record_search_finished
from .decorators import search_from_id
from .models import Search, SearchParams, ExpandingBoxSearchParams, TrackLineCreepingSearchParams
from .view_helpers import check_searches_in_progress


def mission_get(mission_id):
    """
    Convert a mission id into an object
    """
    return get_object_or_404(Mission, pk=mission_id)


@login_required
@asset_id_in_get_post
@mission_asset_get_mission
def find_next_search(request, asset, mission):
    """
    Find the next search for this asset
    Order of preference:
    - Current in progress search for this specific asset
    - Oldest queued search for this specific asset
    - Oldest queued search for this asset type
    - Geographically closest search for the asset type
    """
    if request.method == 'POST':
        lat = request.POST.get('latitude')
        long = request.POST.get('longitude')
    elif request.method == 'GET':
        lat = request.GET.get('latitude')
        long = request.GET.get('longitude')
    else:
        return HttpResponseNotFound('Unknown Method')

    try:
        lat = float(lat)
        long = float(long)
    except (ValueError, TypeError):
        return HttpResponseBadRequest('Invalid lat or long')

    point = Point(long, lat, srid=4326)

    def search_data(search):
        data = {
            'object_url': f"/search/{search.pk}/",
            'distance': int(search.distance_from(point)),
            'length': int(search.length()),
            'sweep_width': int(search.sweep_width),
        }
        return JsonResponse(data)

    # If this asset already has a search in progress, only offer that
    search = check_searches_in_progress(mission, asset)

    if search is None:
        search = Search.oldest_queued_for_asset(mission, asset)

    if search is None:
        # Check for the oldest queue entry for this asset
        search = Search.oldest_queued_for_asset_type(mission, asset.asset_type)

    if search is None:
        search = Search.find_closest(mission, asset.asset_type, point)

    if search:
        return search_data(search)

    return HttpResponseNotFound("No suitable searches exist")


def check_search_state(search, action, asset):
    """
    Check the current state of a search and provide
    a suitable error response if it's not suitable for desired action
    """
    # pylint: disable=R0911
    if search.deleted_at is not None:
        return HttpResponseForbidden("Search has been deleted")
    if search.replaced_by is not None:
        return HttpResponseNotFound("Search has been replaced")
    if search.completed_at is not None or search.completed_by is not None:
        return HttpResponseForbidden("Search already completed")

    if action == 'begin':
        if search.inprogress_by is not None and search.inprogress_by != asset:
            return HttpResponseForbidden("Search already in progress")
    elif action == 'delete':
        if search.inprogress_by is not None:
            return HttpResponseForbidden("Search currently in progress")
    elif action == 'complete':
        if search.inprogress_by is None or search.inprogress_by.id != asset.id:
            return HttpResponseForbidden("Search not in progress by this asset")

    return None


@login_required
@asset_id_in_get_post
@mission_asset_get_mission
def search_begin(request, search_id, object_class, asset, mission):
    """
    An asset has accepted a search

    Mark the search as inprogress with the specified asset
    """
    search = get_object_or_404(object_class, pk=search_id)

    if search.mission != mission:
        return HttpResponseForbidden("Asset not currently assigned to the mission this search is in.")

    inprogress_search = check_searches_in_progress(mission, asset)
    if inprogress_search is not None and inprogress_search != search:
        return HttpResponseForbidden("Asset already has a search in progress.")

    if search.set_inprogress_by(asset, request.user):
        return to_geojson(object_class, [search])

    error = check_search_state(search, 'begin', asset)
    return error if error is not None else HttpResponseNotFound('Try Again')


@login_required
@asset_id_in_get_post
@mission_asset_get_mission
def search_finished(request, search_id, object_class, asset, mission):
    """
    A search has been completed
    """
    search = get_object_or_404(object_class, pk=search_id)
    error = check_search_state(search, 'complete', asset)
    if error is not None:
        return error

    search.completed_at = timezone.now()
    search.completed_by = asset
    search.save()

    timeline_record_search_finished(mission, request.user, asset, search)

    return HttpResponse("Completed")


@login_required
@search_from_id
@data_get_mission_id(arg_name='search')
@mission_is_member
def search_queue(request, search, mission_user):
    """
    Queue a search
    """
    # Check if this search has already been queued
    if search.queued_at:
        return HttpResponseForbidden(f"This search is already queued for {search.get_match()}")

    asset = None
    if request.method == "POST" and 'asset' in request.POST:
        asset = get_object_or_404(Asset, pk=request.POST['asset'])
        # Make sure this asset is a member of this mission
        get_object_or_404(MissionAsset, mission=mission_user.mission, asset=asset, removed__isnull=True)

    search.queue_search(mission_user=mission_user, asset=asset)

    return HttpResponse("Success")


@login_required
@mission_is_member
def search_notstarted(request, mission_user, search_class):
    """
    Get a list of all the not started (search_class) searches (as json)
    """
    return to_geojson(search_class, search_class.all_current(mission_user.mission, started=False, finished=False))


@login_required
def search_notstarted_user(request, search_class, current_only):
    """
    Get a list of all the not started (search_class) searches in current missions this user is a member of (as json)
    """
    return to_geojson(search_class, search_class.all_current_user(request.user, current_only=current_only, started=False, finished=False))


def search_notstarted_kml(request, mission_id, search_class):
    """
    Get a list of all the not started (search_type) searches (as kml)
    """
    mission = mission_get(mission_id)
    return to_kml(search_class, search_class.all_current(mission, started=False, finished=False))


@login_required
@mission_is_member
def search_inprogress(request, mission_user, search_class):
    """
    Get a list of all the inprogress (search_class) searches (as json)
    """
    return to_geojson(search_class, search_class.all_current(mission_user.mission, started=True, finished=False))


@login_required
def search_inprogress_user(request, search_class, current_only):
    """
    Get a list of all the inprogress (search_class) searches in current missions this user is a member of (as json)
    """
    return to_geojson(search_class, search_class.all_current_user(request.user, current_only=current_only, started=True, finished=False))


def search_inprogress_kml(request, mission_id, search_class):
    """
    Get a list of all the inprogress (search_type) searches (as kml)
    """
    mission = mission_get(mission_id)
    return to_kml(search_class, search_class.all_current(mission, started=True, finished=False))


@login_required
@mission_is_member
def search_completed(request, mission_user, search_class):
    """
    Get a list of all the completed (search_class) searches (as json)
    """
    return to_geojson(search_class, search_class.all_current(mission_user.mission, started=True, finished=True))


@login_required
def search_completed_user(request, search_class, current_only):
    """
    Get a list of all the completed (search_class) searches in all missions this user has been a member of (as json)
    """
    return to_geojson(search_class, search_class.all_current_user(request.user, current_only=current_only, started=True, finished=True))


def search_completed_kml(request, mission_id, search_class):
    """
    Get a list of all the completed (search_class) searches (as kml)
    """
    mission = mission_get(mission_id)
    return to_kml(search_class, search_class.all_current(mission, started=True, finished=True))


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
        return HttpResponseNotFound('Unknown Method')

    poi = get_object_or_404(GeoTimeLabel, pk=poi_id, geo_type='poi')
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    search = Search.create_sector_search(SearchParams(poi, asset_type, request.user, sweep_width), save=save)

    return to_geojson(Search, [search])


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
        return HttpResponseNotFound('Unknown Method')

    poi = get_object_or_404(GeoTimeLabel, pk=poi_id, geo_type='poi')
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    sweep_width = float(sweep_width)
    try:
        first_bearing = int(first_bearing)
    except TypeError:
        first_bearing = 0

    search = Search.create_expanding_box_search(ExpandingBoxSearchParams(poi, asset_type, request.user, sweep_width, iterations, first_bearing), save=save)

    return to_geojson(Search, [search])


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
        return HttpResponseNotFound('Unknown Method')

    line = get_object_or_404(GeoTimeLabel, pk=line_id, geo_type='line')
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    search = Search.create_track_line_search(SearchParams(line, asset_type, request.user, sweep_width), save=save)

    return to_geojson(Search, [search])


@login_required
def shore_line_search_create(request):
    """
    Create a shore line search
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
        return HttpResponseNotFound('Unknown Method')

    line = get_object_or_404(GeoTimeLabel, pk=line_id, geo_type='line')
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    search = Search.create_shore_line_search(SearchParams(line, asset_type, request.user, sweep_width), save=save)

    return to_geojson(Search, [search])


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
        return HttpResponseNotFound('Unknown Method')

    line = get_object_or_404(GeoTimeLabel, pk=line_id, geo_type='line')
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    search = Search.create_track_line_creeping_search(TrackLineCreepingSearchParams(line, asset_type, request.user, sweep_width, width), save=save)

    return to_geojson(Search, [search])


@login_required
def polygon_creeping_line_search_create(request):
    """
    Create a creeping line ahead search (from a polygon)
    """
    save = False
    if request.method == 'POST':
        poly_id = request.POST.get('poly_id')
        asset_type_id = request.POST.get('asset_type_id')
        sweep_width = request.POST.get('sweep_width')
        save = True
    elif request.method == 'GET':
        poly_id = request.GET.get('poly_id')
        asset_type_id = request.GET.get('asset_type_id')
        sweep_width = request.GET.get('sweep_width')
    else:
        return HttpResponseNotFound('Unknown Method')

    poly = get_object_or_404(GeoTimeLabel, pk=poly_id, geo_type='polygon')
    asset_type = get_object_or_404(AssetType, pk=asset_type_id)

    search = Search.create_polygon_creeping_line_search(SearchParams(poly, asset_type, request.user, sweep_width), save=save)

    return to_geojson(Search, [search])


@method_decorator(login_required, name="dispatch")
@method_decorator(search_from_id, name="dispatch")
@method_decorator(data_get_mission_id(arg_name='search'), name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class SearchView(View):
    """
    View of a specific search
    """
    def as_json(self, request, search):
        """
        Return this search as a json object
        """
        return to_geojson(Search, [search])

    def get(self, request, search, mission_user):
        """
        Show the search details
        """
        if "application/json" in request.META.get('HTTP_ACCEPT', ''):
            return self.as_json(request, search)
        return render(request, 'search/search_details.html', {'searchId': search.pk, 'missionId': mission_user.mission.pk})

    def delete(self, request, search, mission_user):
        """
        Delete the search, assuming the constraints are satisfied
        """
        error = check_search_state(search, 'delete', None)
        if error is not None:
            return error

        if search.delete(mission_user.user):
            return HttpResponse('Success')

        return HttpResponseNotFound('Unable')
