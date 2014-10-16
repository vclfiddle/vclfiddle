#!/bin/bash

echo "Starting varnishd" >>/fiddle/debug.log
/usr/sbin/varnishd -a 127.0.0.1:80 -f /fiddle/default.vcl -P /run/varnishd.pid 2>&1 >>/fiddle/run.log || exit $?
echo "Started varnishd" >>/fiddle/debug.log

# TODO allow warmup. detect ready.
sleep 2

echo "Starting varnishlog" >>/fiddle/debug.log
varnishlog -D -v -w /fiddle/varnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
echo "Started varnishlog" >>/fiddle/debug.log
sleep 2

echo "Executing requests" >>/fiddle/debug.log
find /fiddle -name request_* -maxdepth 1 -exec /bin/sh -c 'cat {}  | nc 127.0.0.1 80' \; >/dev/null
# TODO replay requests HAR twice here
echo "Executed requests" >>/fiddle/debug.log

echo "Flushing varnishlog" >>/fiddle/debug.log
kill -s SIGUSR1 $(cat /run/varnishlog.pid)
sleep 2 # TODO find a better way to wait for flush

echo "Killing varnishlog and varnishd" >>/fiddle/debug.log
kill -s SIGKILL $(cat /run/varnishlog.pid)
kill -s SIGKILL $(cat /run/varnishd.pid)

echo "Done" >>/fiddle/debug.log
