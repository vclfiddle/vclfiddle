#!/bin/bash

pushd $(dirname $0) >/dev/null || exit $?
scriptroot=$(pwd)
popd >/dev/null

image=$(basename "${scriptroot}/")

sudo docker build --force-rm --tag="${image}:latest" $scriptroot
