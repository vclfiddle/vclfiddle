#!/bin/bash

pushd $(dirname $0) >/dev/null || exit $?
SCRIPTROOT=$(pwd)
popd >/dev/null

IMAGE=$(basename "${SCRIPTROOT}/")

sudo docker build --force-rm --tag="${IMAGE}" $SCRIPTROOT
