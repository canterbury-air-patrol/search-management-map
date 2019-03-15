#!/bin/sh

source venv/bin/activate

pycodestyle --ignore=E501 */*.py

deactivate
