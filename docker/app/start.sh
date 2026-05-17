#!/bin/bash -ex

cp smm/local_settings.py.template smm/local_settings.py

./setup-db.sh

source /code/venv/bin/activate

if [ ! -f "smm/secretkey.txt" ]
then
    python3 -c 'import secrets; print(secrets.token_urlsafe(50))' > smm/secretkey.txt
fi

./manage.py makemigrations
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
