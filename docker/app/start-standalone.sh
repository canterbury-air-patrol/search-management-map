#!/bin/bash  -ex

./setup.sh
./manage.py makemigrations
./manage.py migrate

sed -i 's/DEBUG =.*/DEBUG = True/' smm/local_settings.py

if [ ! -z "$DJANGO_SUPERUSER_USERNAME" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]
then
./manage.py createsuperuser --noinput
fi
./manage.py runserver 0.0.0.0:8080
