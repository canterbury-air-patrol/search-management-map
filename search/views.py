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
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.utils import timezone

from assets.models import AssetType, Asset
from data.models import PointTimeLabel, LineStringTimeLabel
from data.view_helpers import to_kml, to_geojson
from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch, SearchParams, ExpandingBoxSearchParams, TrackLineCreepingSearchParams
from .view_helpers import search_json, search_incomplete, search_completed, check_searches_in_progress


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

    if lat is None or long is None:
        return HttpResponseBadRequest('Invalid lat or long')

    try:
        lat = float(lat)
        long = float(long)
    except (ValueError, TypeError):
        return HttpResponseBadRequest('Invalid lat or long')

    distance = None

    point = Point(long, lat)

    # If this asset already has a search in progress, only offer that
    search = check_searches_in_progress(asset)
    if search is None:
        for object_type in (SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch):
            possible_search = object_type.find_closest(asset.asset_type, point)
            if possible_search:
                if distance is None or possible_search.distance < distance:
                    search = possible_search
                    distance = possible_search.distance

    if search is None:
        return HttpResponseNotFound("No suitable searches exist")

    data = {
        'object_url': "/search/{}/{}/json/".format(search.url_component(), search.pk),
        'distance': int(search.distance_from(point)),
        'length': int(search.length()),
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
        if search.inprogress_by is not None and search.inprogress_by != asset:
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

    search = get_object_or_404(object_class, pk=search_id)

    inprogress_search = check_searches_in_progress(asset)
    if inprogress_search is not None:
        if inprogress_search != search:
            return HttpResponseForbidden("Asset already has a search in progress.")

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

    search = SectorSearch.create(SearchParams(poi, asset_type, request.user, sweep_width), save=save)

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

    search = ExpandingBoxSearch.create(ExpandingBoxSearchParams(poi, asset_type, request.user, sweep_width, iterations, first_bearing), save=save)

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

    search = TrackLineSearch.create(SearchParams(line, asset_type, request.user, sweep_width), save=save)

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

    search = TrackLineCreepingSearch.create(TrackLineCreepingSearchParams(line, asset_type, request.user, sweep_width, width), save=save)

    return to_geojson(TrackLineCreepingSearch, [search])
