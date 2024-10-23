#!/bin/bash -ex

npm ci
npm run check
npm run build-only
if [[ "x$USERID" != "x" ]] && [[ "x$GROUPID" != "x" ]]
then
	chown $USERID:$GROUPID -R dist node_modules
fi
cp -dpR dist/* map/static/
