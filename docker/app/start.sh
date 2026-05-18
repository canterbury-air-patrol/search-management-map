#!/bin/bash -ex

source /code/venv/bin/activate

./manage.py migrate


if [ "$1" == "test" ]
then
    ./manage.py test
else
    if [ ! -z "$DJANGO_SUPERUSER_USERNAME" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]
    then
        ./manage.py createsuperuser --noinput
    fi
    uwsgi --http 0.0.0.0:8080 --module smm.wsgi --master --processes 4 --die-on-term --lazy-apps
fi
