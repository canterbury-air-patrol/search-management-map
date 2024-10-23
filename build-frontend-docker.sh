#!/bin/bash -ex

docker run --mount type=bind,source=$(pwd),target=/usr/src node:20-slim /bin/bash -c "cd /usr/src; USERID=$(id -u) GROUPID=$(id -g) ./build-frontend.sh"
