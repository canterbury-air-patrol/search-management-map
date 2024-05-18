#!/bin/bash -ex

pip install wheel
# Install the required packages
pip install -r requirements.txt

# Setup the image storage directory
mkdir -p images/full images/thumbnail

if [ "x${NODE_DONE}" != "xyes" ]
then
    npm ci
    npm run build
fi

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

./setup-db.sh

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
