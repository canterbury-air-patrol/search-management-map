#!/bin/bash

source venv/bin/activate

# The Django test client speaks plain HTTP, so disable HTTPS-only redirects
# (which default on when DEBUG is False) to stop every request 301'ing.
export SECURE_SSL=False

coverage run --source=. ./manage.py test
RES=$?

rm -fr htmlcov && coverage html

exit $RES
