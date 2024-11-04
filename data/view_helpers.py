"""
Helpers for view functions.

The functions here should cover the logic associated with making
views work.
"""

from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.core.serializers import serialize
from django.contrib.gis.geos import Point, Polygon, LineString, GEOSGeometry

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
        kml_data += f'\t\t<Placemark>\n\t\t\t<name><![CDATA[{str(obj)}]]></name>\n'
        kml_data += f'\t\t\t<description><![CDATA[{str(obj)}]]></description>\n'
        kml_data += GEOSGeometry(getattr(obj, objecttype.GEOFIELD)).kml
        kml_data += '\n\t\t</Placemark>\n'

    kml_data += '\t</Document>\n</kml>'

    return HttpResponse(kml_data, 'application/vnd.google-earth.kml+xml')


# pylint: disable=R0913
def geotimelabel_replace(request, name, replaces, mission, func):
    """
    Create an object to replace another object of the same type,

    Checks to make sure the object hasn't already been deleted or replaced.
    """
    if replaces.deleted_at:
        return HttpResponseNotFound(f"This {name} has been deleted")
    if replaces.replaced_by is not None:
        return HttpResponseNotFound(f"This {name} has already been replaced")
    return func(request, mission=mission, replaces=replaces)


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

    if replaces is not None and not replaces.replace(ptl):
        ptl.delete(request.user)
        return HttpResponseBadRequest()

    return to_geojson(GeoTimeLabel, [ptl])


def user_polygon_make(request, mission=None, replaces=None):
    """
    Create a polygon based on user supplied data.
    """
    if request.method != 'POST':
        return HttpResponseBadRequest()
    points = []
    label = request.POST['label']
    points_count = int(request.POST['points'])
    for i in range(points_count):
        lat = request.POST[f'point{i}_lat']
        lng = request.POST[f'point{i}_lng']
        point = Point(float(lng), float(lat))
        points.append(point)
    points.append(points[0])
    ptl = GeoTimeLabel(geo=Polygon(points), label=label, created_by=request.user, mission=mission, geo_type='polygon')
    ptl.save()
    if replaces is not None and not replaces.replace(ptl):
        ptl.delete(request.user)
        return HttpResponseBadRequest()
    return to_geojson(GeoTimeLabel, [ptl])


def user_line_make(request, mission=None, replaces=None):
    """
    Create a line (string) based on user supplied data.
    """
    if request.method != 'POST':
        return HttpResponseBadRequest()
    points = []
    label = request.POST['label']
    points_count = int(request.POST['points'])
    for i in range(points_count):
        lat = request.POST[f'point{i}_lat']
        lng = request.POST[f'point{i}_lng']
        point = Point(float(lng), float(lat))
        points.append(point)
    lstl = GeoTimeLabel(geo=LineString(points), label=label, created_by=request.user, mission=mission, geo_type='line')
    lstl.save()
    if replaces is not None and not replaces.replace(lstl):
        lstl.delete(request.user)
        return HttpResponseBadRequest()
    return to_geojson(GeoTimeLabel, [lstl])
