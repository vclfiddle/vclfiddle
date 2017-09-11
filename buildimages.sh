#!/bin/bash +xe

images="varnish5_1_3
varnish5_0_0
varnish4_1_8
varnish4_0_5
varnish3_0_7
varnish2_1_5
varnish2_0_6"

while read -r image; do
    image_path="$(dirname $0)/${image}"
    sudo docker build --force-rm --tag="${image}:latest" $image_path
done <<< "$images"
