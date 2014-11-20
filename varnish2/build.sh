#!/bin/bash

pushd $(dirname $0) >/dev/null || exit $?
SCRIPTROOT=$(pwd)
TAG=$(basename $SCRIPTROOT)
popd >/dev/null

sudo docker build --force-rm --tag="$TAG" $SCRIPTROOT
