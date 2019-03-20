#!/bin/sh

# Re-create the virtual env
rm -fr venv
python3 -m venv venv
source venv/bin/activate
# Install the required packages
pip install -r requirements.txt

mkdir -p dl
# Fetch jquery
JQUERY_VERSION=3.3.1
JQUERY_FILE=jquery-${JQUERY_VERSION}.min.js
if [ ! -f dl/${JQUERY_FILE} ]
then
	curl -L https://code.jquery.com/${JQUERY_FILE} -o dl/${JQUERY_FILE}
fi
mkdir -p map/static/jquery/
cp dl/${JQUERY_FILE} map/static/jquery/jquery.js

# Fetch leaflet plugins
LEAFLET_REALTIME_VERSION=2.1.1
LEAFLET_REALTIME_FILE=leaflet-realtime-${LEAFLET_REALTIME_VERSION}.tar.gz
if [ ! -f dl/${LEAFLET_REALTIME_FILE} ]
then
	curl -L https://github.com/perliedman/leaflet-realtime/archive/${LEAFLET_REALTIME_VERSION}.tar.gz -o dl/${LEAFLET_REALTIME_FILE}
fi
# Extract the leaflet plugins
rm -fr tmp; mkdir tmp
mkdir -p map/static/leaflet/realtime/
(cd tmp; tar xf ../dl/${LEAFLET_REALTIME_FILE}; cp leaflet-realtime-${LEAFLET_REALTIME_VERSION}/dist/leaflet-realtime.js ../map/static/leaflet/realtime/)
rm -fr tmp

echo ""

# Create the local settings file from the template
if [ ! -f smm/local_settings.py ]
then
	cp smm/local_settings.py.template smm/local_settings.py
	echo ""
	echo "Create smm/local_settings.py from template"
	echo "You should check this reflects your required settings"
        echo "At a minimum you will need to set your postgis parameters"
fi

if [ ! -f smm/secretkey.txt ]
then
	python -c 'import random; result = "".join([random.choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for i in range(50)]); print(result)' > smm/secretkey.txt	
	echo ""
	echo "Created new secretkey.txt in smm/secretkey.txt"
fi

echo ""
echo "A virtual environment has been created in 'venv'"
echo "run 'source venv/bin/activate' to enter"
echo "and 'deactivate' to leave"
echo ""
echo "To start the server run ./start.sh"
echo "This script will enter the virtual environment and start the server on port 8080"
echo "You may need to create an admin user with './manage.py createsuperuser'"
echo ""
