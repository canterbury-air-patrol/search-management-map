#!/bin/bash

./setup.sh
./manage.py migrate
gunicorn smm.wsgi:application -b 0.0.0.0:8080
