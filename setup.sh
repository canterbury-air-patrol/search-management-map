#!/bin/bash

pip install wheel
# Install the required packages
pip install -r requirements.txt

# Setup the image storage directory
mkdir -p images/full images/thumbnail

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
LEAFLET_REALTIME_VERSION=2.2.0
LEAFLET_REALTIME_FILE=leaflet-realtime-${LEAFLET_REALTIME_VERSION}.tar.gz
if [ ! -f dl/${LEAFLET_REALTIME_FILE} ]
then
	curl -L https://github.com/perliedman/leaflet-realtime/archive/refs/tags/${LEAFLET_REALTIME_VERSION}.tar.gz -o dl/${LEAFLET_REALTIME_FILE}
fi
LEAFLET_DIALOG_VERSION=1.0.5
LEAFLET_DIALOG_FILE=leaflet-dialog-${LEAFLET_DIALOG_VERSION}.tar.gz
if [ ! -f dl/${LEAFLET_DIALOG_FILE} ]
then
	curl -L https://github.com/NBTSolutions/Leaflet.Dialog/archive/v${LEAFLET_DIALOG_VERSION}.tar.gz -o dl/${LEAFLET_DIALOG_FILE}
fi
LEAFLET_LOCATECONTROL_VERSION=0.66.2
LEAFLET_LOCATECONTROL_FILE=leaflet-locatecontrol-${LEAFLET_LOCATECONTROL_VERSION}.tar.gz
if [ ! -f dl/${LEAFLET_LOCATECONTROL_FILE} ]
then
	curl -L https://github.com/domoritz/leaflet-locatecontrol/archive/v${LEAFLET_LOCATECONTROL_VERSION}.tar.gz -o dl/${LEAFLET_LOCATECONTROL_FILE}
fi

# Extract the leaflet plugins
rm -fr tmp; mkdir tmp
mkdir -p map/static/leaflet/realtime/
(cd tmp; tar xf ../dl/${LEAFLET_REALTIME_FILE}; cp leaflet-realtime-${LEAFLET_REALTIME_VERSION}/dist/leaflet-realtime.js ../map/static/leaflet/realtime/)
mkdir -p map/static/leaflet/dialog/
(cd tmp; tar xf ../dl/${LEAFLET_DIALOG_FILE};
	sed -i -e 's/fa-arrows"/fa-arrows-alt"/' Leaflet.Dialog-${LEAFLET_DIALOG_VERSION}/Leaflet.Dialog.js;
	sed -i -e 's/fa-arrows-h /fa-arrows-alt-h /' Leaflet.Dialog-${LEAFLET_DIALOG_VERSION}/Leaflet.Dialog.js;
	cp Leaflet.Dialog-${LEAFLET_DIALOG_VERSION}/Leaflet.Dialog.{js,css} ../map/static/leaflet/dialog/)
rm -fr tmp; mkdir tmp
mkdir -p map/static/leaflet/locatecontrol/
(cd tmp; tar xf ../dl/${LEAFLET_LOCATECONTROL_FILE}; cp leaflet-locatecontrol-${LEAFLET_LOCATECONTROL_VERSION}/dist/*.min.{js,css} ../map/static/leaflet/locatecontrol/)
rm -fr tmp

# Grab fontawesome
FONTAWESOME_VERSION=5.8.1
FONTAWESOME_FILE=fontawesome-v${FONTAWESOME_VERSION}-all.css
if [ ! -f dl/${FONTAWESOME_FILE} ]
then
	curl -L https://use.fontawesome.com/releases/v${FONTAWESOME_VERSION}/css/all.css -o dl/${FONTAWESOME_FILE}
fi
mkdir -p map/static/fontawesome/css
cp dl/${FONTAWESOME_FILE} map/static/fontawesome/css/all.css

FONTAWESOME_WEBFONTS_FILE=fontawesome-v${FONTAWESOME_VERSION}-webfonts.zip
if [ ! -f dl/${FONTAWESOME_WEBFONTS_FILE} ]
then
	curl -L https://use.fontawesome.com/releases/v${FONTAWESOME_VERSION}/fontawesome-free-${FONTAWESOME_VERSION}-web.zip -o dl/${FONTAWESOME_WEBFONTS_FILE}
fi
mkdir -p map/static/fontawesome/webfonts
mkdir -p tmp
(cd tmp; unzip ../dl/${FONTAWESOME_WEBFONTS_FILE}; cp -pR fontawesome-free-${FONTAWESOME_VERSION}-web/webfonts/* ../map/static/fontawesome/webfonts/)
rm -fr tmp

echo ""

# Create the local settings file from the template
if [ ! -f smm/local_settings.py ]
then
	grep -q docker /proc/self/cgroup
	RETCODE=$?
	if [ $RETCODE -eq 0 ]
	then
		cp docker/app/local_settings.py smm/local_settings.py
	else
		cp smm/local_settings.py.template smm/local_settings.py
	fi
	echo ""
	echo "Create smm/local_settings.py from template"
	echo "You should check this reflects your required settings"
        echo "At a minimum you will need to set your postgis parameters"
fi

[ ! -z "$DB_HOST" ] && sed -i "s|'HOST': .*|'HOST': '$DB_HOST',|" smm/local_settings.py || true
[ ! -z "$DB_USER" ] && sed -i "s|'USER': .*|'USER': '$DB_USER',|" smm/local_settings.py || true
[ ! -z "$DB_NAME" ] && sed -i "s|'NAME': .*|'NAME': '$DB_NAME',|" smm/local_settings.py || true
[ ! -z "$DB_PASS" ] && sed -i "s|'PASSWORD': .*|'PASSWORD': '$DB_PASS',|" smm/local_settings.py || true

if [ ! -f smm/secretkey.txt ]
then
	python -c 'import random; result = "".join([random.choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for i in range(50)]); print(result)' > smm/secretkey.txt	
	echo ""
	echo "Created new secretkey.txt in smm/secretkey.txt"
fi

./manage.py collectstatic --no-input

echo ""
echo "To start the server run ./start.sh"
echo "This script will start the server on port 8080"
echo "You may need to create an admin user with './manage.py createsuperuser'"
echo ""
