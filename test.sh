#!/bin/bash

REPO_ROOT=/vagrant

sudo docker build --force-rm --tag="varnish4" $REPO_ROOT/varnish4/

TEST_DIR=/tmp/test-$RANDOM
mkdir --parents $TEST_DIR

echo -e "GET / HTTP/1.1\r\nHost: www.vclfiddle.net\r\n\r\n" >$TEST_DIR/request_0
cp $REPO_ROOT/v4-test.vcl $TEST_DIR/default.vcl

sudo docker run --rm --volume=$TEST_DIR:/fiddle varnish4

echo $TEST_DIR
ls -alF $TEST_DIR
cat $TEST_DIR/debug.log
# TODO rm $TEST_DIR

# docker run --rm -ti varnish4 /bin/bash