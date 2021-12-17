#!/bin/bash

pip install wheel
# Install the required packages
pip install -r requirements.txt

# Setup the image storage directory
mkdir -p images/full images/thumbnail

npm run build

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
