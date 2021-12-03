"""
Helpers for dealing with views related to images
"""

from PIL import Image

from .models import GeoImage


def map_ext(ext):
    """
    Convert a file extension into the name PIL expects
    """
    if ext.upper() == 'JPG':
        ext = 'jpeg'
    return ext


def upload_image_file(mission_user, description, point, file):
    """
    Store an uploaded image file
    """
    # Create an entry in the database for this file
    filename = file.name
    ext = map_ext(filename.split('.')[-1])

    image = GeoImage(mission=mission_user.mission, created_by=mission_user.user, description=description, geo=point, original_format=ext)
    image.save()
    full_image = 'images/full/{}.data'.format(image.pk)
    with open(full_image, 'wb') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    # Create a thumbnail of the image too
    original = Image.open(full_image)
    thumbnail = original.copy()
    thumbnail.thumbnail((128, 128))
    thumbnail.save('images/thumbnail/{}.data'.format(image.pk), ext)
