---
sort: 1
---
# Docker

A docker image is automatically created from the `develop` branch.

## Docker Compose with Postgresql
To bring up SMM and a PostgreSQL server using docker-compose, you can use this docker-compose.yaml

```
version: '3'

services:
  db:
    image: postgis/postgis:15-3.3
    environment:
      - POSTGRES_PASSWORD=postgres
    healthcheck:
      test: "pg_isready --username=postgres"
      timeout: 10s
      retries: 20
  app:
    image: canterburyairpatrol/search-management-map:latest
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DB_HOST=db
      - DB_USER=postgres
      - DB_NAME=postgres
      - DB_PASS=postgres
      - DJANGO_SUPERUSER_USERNAME=admin
      - DJANGO_SUPERUSER_PASSWORD=administrator
      - DJANGO_SUPERUSER_EMAIL=me@example.com
```

This will give you a local instance of SMM running at [http://localhost:8080](http://localhost:8080) that you can login to with user: `admin` and password: `administrator`

This setup makes use of the [postgis/postgis](https://registry.hub.docker.com/r/postgis/postgis/) docker image. If you want to store the data more permanently than what docker-compose does, you can mount a directory from your host to `/var/lib/postgresql/data` (or the value of the environment variable `PGDATA`)

If you plan to use this to setup a production server, it is highly recommend that you set different values for `DJANGO_SUPERUSER_USERNAME` and `DJANGO_SUPERUSER_PASSWORD`

## Using an existing PostgreSQL server
If you have an existing PostgreSQL server that has the PostGIS extension installed, you can use that to store your data.

`docker run -e DB_HOST=mydbserver -e DB_USER=dbuser -e DB_NAME=smm -e DB_PASS=dbpass -e DJANGO_SUPERUSER_USERNAME=admin -e DJANGO_SUPERUSER_PASSWORD=administrator -e DJANGO_SUPERUSER_EMAIL=me@example.com -p 127.0.0.1:8080:8080 canterburyairpatrol/search-management-map`

This will give you a local instance of SMM running at [http://localhost:8080](http://localhost:8080) that you can login to with user: `admin` and password: `administrator`.

On the database server, either the user `dbuser` needs to have the ability to `CREATE EXTENSION postgis;` on the database `smm`, or you need to run `CREATE EXTENSION postgis;` before SMM first tries to connect, or you will get an error.

Note: In the example above the service is only available to connect to on the local device. It is highly recommended that you use a different username and password instead of the example `admin` account, if you intend to allow anyone else to access this service.

While this instance will store most of it's data to your PostgreSQL database, any uploaded images will be stored in the instance. If you want to persistently store this images, you will need to supply a location for the thumbnails and original images by including the arguments `-v /data/thumbnails:/code/images/thumbnails -v /data/images:/code/images/full` to the docker command line above.