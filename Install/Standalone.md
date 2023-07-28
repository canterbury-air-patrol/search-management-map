---
sort: 2
---

# Local Install
You can also run Search Management Map directly on your local machine, or any suitable server.

These instructions use the venv version of the setup and start scripts. These create a local folder called `venv` that contains the python packages required to run SMM.

## Pre-requisites

Debian Bookworm:
`apt install git python3 python3-venv python3-dev build-essential npm libgdal32`

### PostgreSQL
You will need a PostgreSQL server with the PostGIS extension.

Potentially you could run one on the localhost by installing it:
`apt install postgis`

You should create a new user and database for your SMM instance.

## Fetch the code
Clone Search Management Map from the GitHub [repo](https://github.com/canterbury-air-patrol/search-management-map/)

`git clone https://github.com/canterbury-air-patrol/search-management-map.git/`

## Setup
You will need to run the `setup-venv.sh` script when you first create your Search Management Map instance. Also, it is useful to run again whenever you update or your python3 version is updated.

You can specify the database settings when running the setup script so you don't need to manually edit the `smm/local_settings.py` file to get started.

`DB_HOST=localhost DB_USER=postgres DB_NAME=smm DB_PASS=postgres ./setup-venv.sh`

## Start
You can start your instance by running:

`./start-venv.sh`

This will run the database migrations and start the server listening on port 8080