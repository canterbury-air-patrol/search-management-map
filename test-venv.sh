#!/bin/bash

source venv/bin/activate

coverage run --source=. ./manage.py test
RES=$?

rm -fr htmlcov && coverage html

exit $RES
