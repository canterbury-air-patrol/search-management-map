"""
Django settings for smm project.
"""

import os

# Import other settings
from smm.local_settings import *

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(BASE_DIR, 'smm', 'secretkey.txt')) as f:
    SECRET_KEY = f.read().strip()

# Application definition

INSTALLED_APPS = [
    'mission',
    'map',
    'assets',
    'data',
    'search',
    'timeline',
    'images',
    'marinesar',
    'organization',
    'icons',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'smm.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smm.wsgi.application'


# Password validation
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/stable/topics/i18n/

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/stable/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

LOGIN_REDIRECT_URL = '/'

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'


# Security: HTTPS-only cookies and SSL redirect.
# https://docs.djangoproject.com/en/stable/topics/security/
#
# Enabled by default in production and disabled automatically when DEBUG is on,
# so local development runs over plain HTTP with no extra setup. Override either
# way with the SECURE_SSL env var (set SECURE_SSL=False for HTTP-only
# deployments, e.g. the bundled docker-compose demo).
SECURE_SSL = os.environ.get('SECURE_SSL', 'False' if globals().get('DEBUG', False) else 'True').strip().lower() in ('true', '1', 'yes', 'on')

SESSION_COOKIE_SECURE = SECURE_SSL
CSRF_COOKIE_SECURE = SECURE_SSL
SECURE_SSL_REDIRECT = SECURE_SSL

if SECURE_SSL:
    # TLS is terminated at the reverse proxy / load balancer in front of uWSGI.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    # HSTS is opt-in and off by default: it is hard to undo, so operators should
    # set SECURE_HSTS_SECONDS (e.g. 31536000) only once HTTPS-only is confirmed.
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '0'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
    SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS > 0
