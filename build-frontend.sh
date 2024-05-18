#!/bin/bash -ex

docker run --mount type=bind,source=$(pwd),target=/usr/src node:20-slim /bin/bash -c "cd /usr/src; npm ci; npm run check; npm run build-only; chown $(id -u):$(id -g) -R dist node_modules; cp -dpR dist/* map/static/"
