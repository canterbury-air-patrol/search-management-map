#!/bin/bash

./setup.sh
./manage.py migrate
./manage.py createsuperuser
