# Search Management Map

A system for planning and managing searches. Define a search area and monitor progress in real time.

## Getting Started

### Prerequisites

* python3 with venv and pip
* postgresql with postgis

### Fetching and start

```
git clone https://github.com/canterbury-air-patrol/search-management-map.git
cd search-management-map
./setup-venv.sh
# follow the instructions in the output from setup-venv.sh
./start-venv.sh
```

### With Docker
```
git clone https://github.com/canterbury-air-patrol/search-management-map.git
cd search-management-map
docker-compose up
```

#### You can run the tests under docker with:
```
docker-compose run app ./docker/app/test.sh
```

#### Configuration

The container generates `smm/local_settings.py` from the template at startup and
reads its configuration from environment variables (see `docker-compose.yaml`
for a working example):

| Variable | Purpose | Default |
| --- | --- | --- |
| `DB_HOST` | PostGIS host | (from template) |
| `DB_NAME` | Database name | (from template) |
| `DB_USER` | Database user | (from template) |
| `DB_PASS` | Database password | (from template) |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost` |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated trusted origins | `http://localhost:8080` |
| `SECURE_SSL` | HTTPS-only cookies + SSL redirect. Defaults on (off when `DEBUG`); set `False` for plain-HTTP deployments | (off if `DEBUG`, else on) |
| `SECURE_HSTS_SECONDS` | Enable HSTS for this many seconds (e.g. `31536000`). Leave `0` until HTTPS-only is confirmed | `0` |
| `DJANGO_SUPERUSER_USERNAME` | Superuser created on first start, if set | (unset) |
| `DJANGO_SUPERUSER_PASSWORD` | Password for that superuser | (unset) |
| `DJANGO_SUPERUSER_EMAIL` | Email for that superuser | (unset) |

## Deploying

The container runs under uWSGI. For other deployment options, refer to the
[Django WSGI deployment documentation](https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/).

## Authors
See the list of [contributors](https://github.com/canterbury-air-patrol/search-management-map/contributors).

## License
This project is licensed under GNU GPLv2 see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements
Thanks to all the wonderful people who wrote, tested, and provided feedback on the libraries and applications we used to make this.
