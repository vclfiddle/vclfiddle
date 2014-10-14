#!/bin/bash

REPO_ROOT=/vagrant

sudo docker build --force-rm --tag="varnish4" $REPO_ROOT/varnish4/

TEST_DIR=/tmp/test-$RANDOM
mkdir --parents $TEST_DIR

#echo -n "www.google.com" >$TEST_DIR/backend
cp $REPO_ROOT/v4-test.vcl $TEST_DIR/default.vcl

docker run --rm --volume=$TEST_DIR:/fiddle varnish4

ls -alF $TEST_DIR
# TODO rm $TEST_DIR

# docker run --rm -ti varnish4 /bin/bash