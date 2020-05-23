"""
Views for dealing with images uploaded by users

"""

from django.http import HttpResponseBadRequest, HttpResponseRedirect, FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from django.contrib.gis.geos import Point

from mission.decorators import mission_is_member
from data.view_helpers import to_geojson
from timeline.helpers import timeline_record_image_priority_changed

from .forms import UploadImageForm
from .view_helpers import upload_image_file
from .models import GeoImage


@mission_is_member
def image_upload(request, mission_id, mission_user):
    """
    All users (probably an asset) to upload an image with a location (and description)
    """
    if request.method == 'POST':
        form = UploadImageForm(request.POST, request.FILES)
        if form.is_valid():
            latitude = request.POST.get('latitude')
            longitude = request.POST.get('longitude')
            point = None
            try:
                point = Point(float(longitude), float(latitude))
            except (ValueError, TypeError):
                return HttpResponseBadRequest('Invalid lat/long')

            upload_image_file(mission_user, form.cleaned_data['description'], point, request.FILES['file'])
            return HttpResponseRedirect('/mission/{}/map/'.format(mission_id))
    else:
        form = UploadImageForm()

    data = {
        'form': form,
        'mission': mission_user.mission,
    }

    return render(request, 'image-upload.html', data)


@login_required
@mission_is_member
def images_list_all(request, mission_id, mission_user):
    """
    Get all the current Images as geojson
    """
    return to_geojson(GeoImage, GeoImage.all_current(mission_user.mission))


@login_required
@mission_is_member
def images_list_important(request, mission_id, mission_user):
    """
    Get the current priority Images as geojson
    """
    return to_geojson(GeoImage, GeoImage.all_current(mission_user.mission).exclude(priority=False))


@login_required
@mission_is_member
def image_get_full(request, mission_id, image_id, mission_user):
    """
    Return the full sized version of the image
    """
    # Check the image is valid for this mission
    image = get_object_or_404(GeoImage, pk=image_id, mission=mission_user.mission)

    return FileResponse(open('images/full/{}.data'.format(image_id), 'rb'), filename='original-{}.{}'.format(image_id, image.original_format))


@login_required
@mission_is_member
def image_get_thumbnail(request, mission_id, image_id, mission_user):
    """
    Return the thumbnail version of the image
    """
    # Check the image is valid for this mission
    image = get_object_or_404(GeoImage, pk=image_id, mission=mission_user.mission)

    return FileResponse(open('images/thumbnail/{}.data'.format(image_id), 'rb'), filename='thumbnail-{}.{}'.format(image_id, image.original_format))


@login_required
@mission_is_member
def image_priority_set(request, mission_id, image_id, mission_user):
    """
    Set the priority flag on an image
    """
    image = get_object_or_404(GeoImage, pk=image_id, mission=mission_user.mission)
    image.priority = True
    image.save()
    timeline_record_image_priority_changed(mission_user.mission, mission_user.user, image)

    return HttpResponse("Done")


@login_required
@mission_is_member
def image_priority_unset(request, mission_id, image_id, mission_user):
    """
    UnSet the priority flag on an image
    """
    image = get_object_or_404(GeoImage, pk=image_id, mission=mission_user.mission)
    image.priority = False
    image.save()
    timeline_record_image_priority_changed(mission_user.mission, mission_user.user, image)

    return HttpResponse("Done")
