#!/bin/bash

pushd $(dirname $0) >/dev/null || exit $?
SCRIPTROOT=$(pwd)
popd >/dev/null

$SCRIPTROOT/build.sh

IMAGE=$(basename "${SCRIPTROOT}/")

# simple test
TEST_DIR=/tmp/vclfiddle-test-$RANDOM
mkdir --parents $TEST_DIR

echo -en "GET / HTTP/1.1\r\nHost: www.vclfiddle.net\r\n\r\n" >$TEST_DIR/request_0
echo -en 'vcl 4.0; backend default { .host = "www.vclfiddle.net"; .port = "80"; }' >$TEST_DIR/default.vcl

echo $TEST_DIR
/opt/vclfiddle/run-varnish-container $IMAGE $TEST_DIR

test -s $TEST_DIR/run.log && echo 'FAILURE: run.log is not empty'
grep -Fq Done $TEST_DIR/debug.log || echo 'FAILURE: debug.log missing Done line'
test -f $TEST_DIR/response_0 || echo 'FAILURE: response_0 missing'
grep -Fq RespStatus $TEST_DIR/varnishlog || echo 'FAILURE: varnishlog missing RespStatus line'
grep -Fq VCL_trace $TEST_DIR/varnishlog || echo 'FAILURE: varnishlog missing VCL_trace line'
test -s $TEST_DIR/varnishncsa || echo 'FAILURE: varnishncsa is missing or empty'

# bad VCL test
TEST_DIR=/tmp/vclfiddle-test-$RANDOM
mkdir --parents $TEST_DIR

echo -en "GET / HTTP/1.1\r\nHost: www.vclfiddle.net\r\n\r\n" >$TEST_DIR/request_0
echo -en 'vcl 4.0; backend default { .host = "www.vclfiddle.net"; .port = "80"; } sub vcl_recv { set beresp.http.Foo = "bar"; }' >$TEST_DIR/default.vcl

echo $TEST_DIR
/opt/vclfiddle/run-varnish-container $IMAGE $TEST_DIR

grep -Fq 'VCL compilation failed' $TEST_DIR/run.log || echo 'FAILURE: run.log missing compilation failed line'
