# This file contains your site-specific settings
# Make changes as required and make sure to save
# it as local_settings.py

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

CSRF_TRUSTED_ORIGINS = ['http://localhost:8080', 'http://HOSTNAME']

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'HOST': 'POSTGRES_SERVER',
        'NAME': 'POSTGRES_DBNAME',
        'USER': 'POSTGRES_USER',
        'PASSWORD': 'POSTGRES_PASSWORD',
    }
}
