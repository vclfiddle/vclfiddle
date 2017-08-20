#!/bin/bash +xe

images="varnish5_1_3
varnish5_0_0
varnish4_1_8
varnish4_0_5
varnish3
varnish2"

while read -r image; do
    image_path="$(dirname $0)/${image}"
    sudo docker build --force-rm --tag="${image}" $image_path
done <<< "$images"
