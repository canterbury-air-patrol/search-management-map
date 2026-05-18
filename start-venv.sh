#!/bin/bash

source venv/bin/activate
export DJANGO_SECRET_KEY=$(cat smm/secretkey.txt)
./start.sh
