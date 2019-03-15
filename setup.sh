#!/bin/sh

# Re-create the virtual env
rm -fr venv
python3 -m venv venv
source venv/bin/activate
# Install the required packages
pip install -r requirements.txt

echo ""

# Create the local settings file from the template
if [ ! -f smm/local_settings.py ]
then
	cp smm/local_settings.py.template smm/local_settings.py
	echo ""
	echo "Create smm/local_settings.py from template"
	echo "You should check this reflects your required settings"
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
