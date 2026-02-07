#!/bin/bash -ex

source venv/bin/activate

pycodestyle --ignore=E501 */*.py

pylint map/ data/ assets/ search/ mission/ timeline/ images/ marinesar/

deactivate
