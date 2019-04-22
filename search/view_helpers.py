from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.core.serializers import serialize
from django.contrib.auth.decorators import login_required

from .models import SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch


@login_required
def search_json(request, id, objectClass):
    search = get_object_or_404(objectClass, pk=id)
    geojson_data = serialize('geojson', [search], geometry_field='line',
                             fields=objectClass.GEOJSON_FIELDS,
                             use_natural_foreign_keys=True)
    return HttpResponse(geojson_data, content_type='application/json')


def search_incomplete(request, objectClass):
    return objectClass.objects.exclude(deleted=True).exclude(completed__isnull=False)


def search_completed(request, objectClass):
    return objectClass.objects.exclude(deleted=True).exclude(completed__isnull=True)


def check_searches_in_progress(asset):
    for objectClass in (SectorSearch, ExpandingBoxSearch, TrackLineSearch, TrackLineCreepingSearch):
        searches = objectClass.objects.filter(inprogress_by=asset).exclude(completed__isnull=False)
        if len(searches) > 0:
            return True

    return False
