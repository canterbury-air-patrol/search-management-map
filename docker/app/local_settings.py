# This file contains your site-specific settings
# Make changes as required and make sure to save
# it as local_settings.py

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['*']

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'HOST': 'db',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'password'
    }
}

# You can write your own leaflet configuration here
# Refer to: https://django-leaflet.readthedocs.io/en/latest/templates.html
LEAFLET_CONFIG = {
}
