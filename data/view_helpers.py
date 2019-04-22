from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.core.serializers import serialize
from django.contrib.gis.geos import Point, Polygon, LineString
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import AssetPointTime, PointTime, PointTimeLabel, PolygonTimeLabel, LineStringTimeLabel


def userobject_not_deleted_or_replaced(objecttype):
    return objecttype.objects.exclude(deleted=True).exclude(replaced_by__isnull=False)


def to_geojson(objecttype, objects):
    geojson_data = serialize('geojson', objects, geometry_field=objecttype.GEOFIELD,
                             fields=objecttype.GEOJSON_FIELDS, use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


def userobject_replace(objecttype, request, name, pk, func):
    replaces = get_object_or_404(objecttype, pk=pk)
    if replaces.deleted:
        return HttpResponseNotFound("This {} has been deleted".format(name))
    if replaces.replaced_by is not None:
        return HttpResponseNotFound("This {} has already been replaced".format(name))
    return func(request, replaces=replaces)


def userobject_delete(objecttype, request, name, pk):
    object = get_object_or_404(objecttype, pk=pk)
    if object.deleted:
        return HttpResponseNotFound("This {} has already been deleted".format(name))
    if object.replaced_by is not None:
        return HttpResponseNotFound("This {} has been replaced".format(name))
    object.deleted = True
    object.deleted_by = request.user
    object.deleted_at = timezone.now()
    object.save()
    return HttpResponse("Deleted")


def point_label_make(request, replaces=None):
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

    p = Point(float(poi_lon), float(poi_lat))

    ptl = PointTimeLabel(point=p, label=poi_label, creator=request.user)
    ptl.save()

    if replaces is not None:
        replaces.replaced_by = ptl
        replaces.save()

    return HttpResponse()


def user_polygon_make(request, replaces=None):
    if request.method == 'POST':
        points = []
        label = request.POST['label']
        points_count = int(request.POST['points'])
        for i in range(0, points_count):
            lat = request.POST['point{}_lat'.format(i)]
            lng = request.POST['point{}_lng'.format(i)]
            p = Point(float(lng), float(lat))
            points.append(p)
        points.append(points[0])
        ptl = PolygonTimeLabel(polygon=Polygon(points), label=label, creator=request.user)
        ptl.save()
        if replaces is not None:
            replaces.replaced_by = ptl
            replaces.save()
        return HttpResponse()

    return HttpResponseBadRequest()


def user_line_make(request, replaces=None):
    if request.method == 'POST':
        points = []
        label = request.POST['label']
        points_count = int(request.POST['points'])
        for i in range(0, points_count):
            lat = request.POST['point{}_lat'.format(i)]
            lng = request.POST['point{}_lng'.format(i)]
            p = Point(float(lng), float(lat))
            points.append(p)
        lstl = LineStringTimeLabel(line=LineString(points), label=label, creator=request.user)
        lstl.save()
        print(lstl)
        if replaces is not None:
            replaces.replaced_by = lstl
            replaces.save()
            print(replaces)
        return HttpResponse()

    return HttpResponseBadRequest()
