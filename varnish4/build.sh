#!/bin/bash

pushd $(dirname $0) >/dev/null || exit $?
SCRIPTROOT=$(pwd)
popd >/dev/null

sudo docker build --force-rm --tag="varnish4" $SCRIPTROOT
