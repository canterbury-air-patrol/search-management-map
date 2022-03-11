#!/bin/bash -ex

[ ! -z "$DB_HOST" ] && sed -i "s|'HOST': .*|'HOST': '$DB_HOST',|" smm/local_settings.py || true
[ ! -z "$DB_USER" ] && sed -i "s|'USER': .*|'USER': '$DB_USER',|" smm/local_settings.py || true
[ ! -z "$DB_NAME" ] && sed -i "s|'NAME': .*|'NAME': '$DB_NAME',|" smm/local_settings.py || true
[ ! -z "$DB_PASS" ] && sed -i "s|'PASSWORD': .*|'PASSWORD': '$DB_PASS',|" smm/local_settings.py || true

