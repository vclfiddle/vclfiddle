#!/bin/bash

function debuglog {
  echo "$(date '+%Y-%m-%d %T.%3N') $@" >>//fiddle/debug.log
}

debuglog Compiling VCL
/usr/sbin/varnishd -C -f /fiddle/default.vcl >/fiddle/vcl.c 2>>/fiddle/run.log || exit $?
debuglog "Compiled VCL"

debuglog "Starting varnishd"
/usr/sbin/varnishd -a 127.0.0.1:80 -f /fiddle/default.vcl -P /run/varnishd.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishd"

debuglog "Starting varnishlog"
varnishlog -D -v -w /fiddle/varnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishlog"

debuglog "Executing requests"
find /fiddle -name request_* -maxdepth 1 -exec /bin/sh -c 'cat {}  | nc 127.0.0.1 80' \; >/dev/null
# TODO replay requests HAR twice here
debuglog "Executed requests"

debuglog "Flushing varnishlog"
kill -s SIGUSR1 $(cat /run/varnishlog.pid)

debuglog "Done"
