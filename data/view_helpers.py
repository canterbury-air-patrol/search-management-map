"""
Helpers for view functions.

The functions here should cover the logic associated with making
views work.
"""

from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest, HttpResponseForbidden
from django.core.serializers import serialize
from django.contrib.gis.geos import Point, Polygon, LineString, GEOSGeometry
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import GeoTimeLabel


def to_geojson(objecttype, objects):
    """
    Convert a set of objects to geojson and return them as an http response
    """
    geojson_data = serialize('geojson', objects, geometry_field=objecttype.GEOFIELD,
                             fields=objecttype.GEOJSON_FIELDS, use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/geo+json')


def to_kml(objecttype, objects):
    """
    Convert a set of objects to kml and return them as an http response
    """
    kml_data = '<?xml version="1.0" encoding="UTF-8"?>\n' + \
               '<kml xmlns="http://www.opengis.net/kml/2.2">\n' + \
               '\t<Document>\n'
    for obj in objects:
        kml_data += '\t\t<Placemark>\n\t\t\t<name><![CDATA[{}]]></name>\n'.format(str(obj))
        kml_data += '\t\t\t<description><![CDATA[{}]]></description>\n'.format(str(obj))
        kml_data += GEOSGeometry(getattr(obj, objecttype.GEOFIELD)).kml
        kml_data += '\n\t\t</Placemark>\n'

    kml_data += '\t</Document>\n</kml>'

    return HttpResponse(kml_data, 'application/vnd.google-earth.kml+xml')


def geotimelabel_replace(request, name, object_id, geo_type, mission, func):
    """
    Create an object to replace another object of the same type,

    Checks to make sure the object hasn't already been deleted or replaced.
    """
    replaces = get_object_or_404(GeoTimeLabel, pk=object_id)
    if replaces.geo_type != geo_type:
        return HttpResponseNotFound("Wrong object type")
    if replaces.deleted_at:
        return HttpResponseNotFound("This {} has been deleted".format(name))
    if replaces.replaced_by is not None:
        return HttpResponseNotFound("This {} has already been replaced".format(name))
    return func(request, mission=mission, replaces=replaces)


def geotimelabel_delete(request, name, object_id, geo_type, mission_user):
    """
    Mark a user object as deleted

    Checks to make sure the object hasn't already been deleted or replaced.
    """
    obj = get_object_or_404(GeoTimeLabel, pk=object_id)
    if obj.geo_type != geo_type:
        return HttpResponseNotFound("Wrong object type")
    if not obj.delete(request.user):
        if obj.deleted_at:
            return HttpResponseNotFound("This {} has already been deleted".format(name))
        if obj.replaced_by is not None:
            return HttpResponseNotFound("This {} has been replaced".format(name))
    return HttpResponse("Deleted")


def check_userobject_move(make_func):
    """
    Make sure that move doesn't move across missions
    """
    def moving_check(*args, **kwargs):
        try:
            replaces = kwargs['replaces']
        except KeyError:
            replaces = None
        mission = kwargs['mission']
        if replaces is not None:
            if replaces.mission.pk != mission.pk:
                return HttpResponseForbidden("Moving objects between missions is prohibited")
        return make_func(*args, **kwargs)
    return moving_check


@check_userobject_move
def point_label_make(request, mission=None, replaces=None):
    """
    Create or replace a POI based on user supplied data.
    """
    poi_lat = ''
    poi_lon = ''
    poi_label = ''
    if request.method == 'GET':
        poi_lat = request.GET.get('lat')
        poi_lon = request.GET.get('lon')
        poi_label = request.GET.get('label')
    elif request.method == 'POST':
        poi_lat = request.POST.get('lat')
        poi_lon = request.POST.get('lon')
        poi_label = request.POST.get('label')

    if poi_lat is None or poi_lon is None or poi_label is None:
        return HttpResponseBadRequest()

    point = Point(float(poi_lon), float(poi_lat))

    ptl = GeoTimeLabel(geo=point, label=poi_label, created_by=request.user, mission=mission, geo_type='poi')
    ptl.save()

    if replaces is not None:
        if not replaces.replace(ptl):
            ptl.delete()
            return HttpResponseBadRequest()

    return HttpResponse()


@check_userobject_move
def user_polygon_make(request, mission=None, replaces=None):
    """
    Create a polygon based on user supplied data.
    """
    if request.method == 'POST':
        points = []
        label = request.POST['label']
        points_count = int(request.POST['points'])
        for i in range(0, points_count):
            lat = request.POST['point{}_lat'.format(i)]
            lng = request.POST['point{}_lng'.format(i)]
            point = Point(float(lng), float(lat))
            points.append(point)
        points.append(points[0])
        ptl = GeoTimeLabel(geo=Polygon(points), label=label, created_by=request.user, mission=mission, geo_type='polygon')
        ptl.save()
        if replaces is not None:
            if not replaces.replace(ptl):
                ptl.delete()
                return HttpResponseBadRequest()
        return HttpResponse()

    return HttpResponseBadRequest()


@check_userobject_move
def user_line_make(request, mission=None, replaces=None):
    """
    Create a line (string) based on user supplied data.
    """
    if request.method == 'POST':
        points = []
        label = request.POST['label']
        points_count = int(request.POST['points'])
        for i in range(0, points_count):
            lat = request.POST['point{}_lat'.format(i)]
            lng = request.POST['point{}_lng'.format(i)]
            point = Point(float(lng), float(lat))
            points.append(point)
        lstl = GeoTimeLabel(geo=LineString(points), label=label, created_by=request.user, mission=mission, geo_type='line')
        lstl.save()
        if replaces is not None:
            if not replaces.replace(ptl):
                ptl.delete()
                return HttpResponseBadRequest()
        return HttpResponse()

    return HttpResponseBadRequest()
