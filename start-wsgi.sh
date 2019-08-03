#!/bin/bash

source venv/bin/activate

./manage.py migrate
uwsgi --socket 127.0.0.1:8080 --protocol=http -w smm.wsgi
