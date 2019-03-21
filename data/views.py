from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point, Polygon
from django.core.serializers import serialize
from django.shortcuts import get_object_or_404

from assets.models import Asset
from .models import AssetPointTime, PointTime, PointTimeLabel, PolygonTimeLabel


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
    except TypeError:
        pass
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
    pois = PointTimeLabel.objects.exclude(deleted=True).exclude(replaced_by__isnull=False)

    geojson_data = serialize('geojson', pois, geometry_field='point',
                             fields=PointTimeLabel.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def point_label_create(request):
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

    PointTimeLabel(point=p, label=poi_label, creator=request.user).save()

    return HttpResponse()


@login_required
def user_polygons_all(request):
    polygons = PolygonTimeLabel.objects.exclude(deleted=True).exclude(replaced_by__isnull=False)
    geojson_data = serialize('geojson', polygons,
                             geometry_field='polygon',
                             fields=PolygonTimeLabel.GEOJSON_FIELDS)
    return HttpResponse(geojson_data, content_type='application/json')


@login_required
def user_polygon_create(request):
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
        PolygonTimeLabel(polygon=Polygon(points), label=label, creator=request.user).save()
        return HttpResponse()
    return HttpResponseBadRequest()
