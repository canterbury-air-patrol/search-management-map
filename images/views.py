"""
Views for dealing with images uploaded by users

"""

import json

from django.http import HttpResponseBadRequest, HttpResponseRedirect, FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.gis.geos import Point
from django.utils.decorators import method_decorator
from django.views import View

from mission.decorators import mission_is_member, mission_is_member_no_variable
from data.decorators import data_get_mission_id
from data.view_helpers import to_geojson
from timeline.helpers import timeline_record_image_priority_changed

from .decorators import image_from_id
from .forms import UploadImageForm
from .view_helpers import upload_image_file
from .models import GeoImage


@method_decorator(login_required, name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class ImageUploadView(View):
    """Allow users (typically an asset) to upload an image with a location."""

    def post(self, request, mission_user):
        """Handle image upload."""
        form = UploadImageForm(request.POST, request.FILES)
        if form.is_valid():
            latitude = request.POST.get('latitude')
            longitude = request.POST.get('longitude')
            try:
                point = Point(float(longitude), float(latitude))
            except (ValueError, TypeError):
                return HttpResponseBadRequest('Invalid lat/long')
            upload_image_file(mission_user, form.cleaned_data['description'], point, request.FILES['file'])
            return HttpResponseRedirect(f'/mission/{mission_user.mission.pk}/map/')
        return HttpResponseBadRequest()


@login_required
@mission_is_member
def images_list_all(request, mission_user):
    """
    Get all the current Images as geojson
    """
    return to_geojson(GeoImage, GeoImage.all_current(mission_user.mission))


@login_required
def images_list_all_user(request, current_only):
    """
    Get all the current Images as geojson from all missions
    """
    return to_geojson(GeoImage, GeoImage.all_current_user(request.user, current_only=current_only))


@login_required
@mission_is_member
def images_list_important(request, mission_user):
    """
    Get the current priority Images as geojson
    """
    return to_geojson(GeoImage, GeoImage.all_current(mission_user.mission).exclude(priority=False))


@login_required
def images_list_important_user(request, current_only):
    """
    Get the current priority Images as geojson from all missions
    """
    return to_geojson(GeoImage, GeoImage.all_current_user(request.user, current_only=current_only).exclude(priority=False))


@login_required
def images_list_important_current(request):
    """
    Get the current priority Images as geojson from current missions
    """
    return to_geojson(GeoImage, GeoImage.all_current_user(request.user, current_only=True).exclude(priority=False))


@login_required
@image_from_id
@data_get_mission_id(arg_name='image')
@mission_is_member_no_variable
def image_get_full(request, image):
    """
    Return the full sized version of the image
    """
    return FileResponse(open(f'images/full/{image.pk}.data', 'rb'), filename=f'original-{image.pk}.{image.original_format}')


@login_required
@image_from_id
@data_get_mission_id(arg_name='image')
@mission_is_member_no_variable
def image_get_thumbnail(request, image):
    """
    Return the thumbnail version of the image
    """
    return FileResponse(open(f'images/thumbnail/{image.pk}.data', 'rb'), filename=f'thumbnail-{image.pk}.{image.original_format}')


@method_decorator(login_required, name="dispatch")
@method_decorator(image_from_id, name="dispatch")
@method_decorator(data_get_mission_id(arg_name='image'), name="dispatch")
@method_decorator(mission_is_member, name="dispatch")
class ImagePriorityView(View):
    """Set or unset the priority flag on an image via PATCH."""

    def patch(self, request, image, mission_user):
        """Update image priority from JSON body {"priority": true/false}."""
        try:
            body = json.loads(request.body)
            priority = bool(body.get('priority'))
        except (ValueError, KeyError):
            return HttpResponseBadRequest('Expected JSON body with {"priority": true/false}')
        image.priority = priority
        image.save()
        timeline_record_image_priority_changed(mission_user.mission, mission_user.user, image)
        return HttpResponse("Done")
