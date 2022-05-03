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

## Deploying
[Refer to Django mod_wsgi documentation](https://docs.djangoproject.com/en/2.1/howto/deployment/wsgi/)

## Authors
See the list of [contributors](https://github.com/canterbury-air-patrol/search-management-map/contributors).

## License
This project is licensed under GNU GPLv2 see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements
Thanks to all the wonderful people who wrote, tested, and provided feedback on the libraries and applications we used to make this.
