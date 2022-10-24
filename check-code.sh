#!/bin/bash -ex

source venv/bin/activate

pycodestyle --ignore=E501 */*.py

pylint --max-line-length=240 --load-plugins pylint_django --django-settings-module=smm.settings --ignore migrations map/ data/ assets/ search/ mission/ timeline/ images/ marinesar/

deactivate
