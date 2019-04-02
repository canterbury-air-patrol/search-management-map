#!/bin/bash

source venv/bin/activate

./manage.py migrate
./manage.py runserver 0.0.0.0:8080
