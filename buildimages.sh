#!/bin/bash +xe

images="varnish4_1_3
varnish4_1_2
varnish4_1_1
varnish4_1_0
varnish4_0_3
varnish4_0_2
varnish3
varnish2"

while read -r image; do
    image_path="$(dirname $0)/${image}"
    sudo docker build --force-rm --tag="${image}" $image_path
done <<< "$images"