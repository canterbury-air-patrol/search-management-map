#!/bin/bash

source venv/bin/activate

pycodestyle --ignore=E501 */*.py

pylint --max-line-length=240 --load-plugins pylint_django map/ data/ assets/ search/

deactivate
