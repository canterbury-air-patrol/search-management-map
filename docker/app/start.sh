#!/bin/bash -ex

cp smm/local_settings.py.template smm/local_settings.py

./setup-db.sh

source /code/venv/bin/activate

./manage.py makemigrations
./manage.py migrate

sed -i 's/DEBUG =.*/DEBUG = True/' smm/local_settings.py
sed -i 's/HOSTNAME/${HOSTNAME}/' smm/local_settings.py

if [ "$1" == "test" ]
then
    ./manage.py test
else
    if [ ! -z "$DJANGO_SUPERUSER_USERNAME" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]
    then
        ./manage.py createsuperuser --noinput
    fi
    ./manage.py runserver 0.0.0.0:8080
fi
