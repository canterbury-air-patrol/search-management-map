#!/bin/bash

# Re-create the virtual env
rm -fr venv
python3 -m venv venv
source venv/bin/activate
pip install wheel
# Install the required packages
pip install -r requirements.txt

./setup.sh

echo ""
echo "A virtual environment has been created in 'venv'"
echo "run 'source venv/bin/activate' to enter"
echo "and 'deactivate' to leave"
echo ""
echo "Use ./start-venv.sh in place of ./start.sh mentioned above"
