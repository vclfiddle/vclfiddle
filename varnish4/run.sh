#!/bin/bash

function debuglog {
  echo "$(date '+%Y-%m-%d %T.%3N') $@" >>//fiddle/debug.log
}

function varnishcommand {
  debuglog "Executing Varnish command: $@"
  /usr/bin/varnishadm -T 127.0.0.1:6082 -S /etc/varnish/secret $@ 2>>/fiddle/run.log || exit $?
  debuglog "Executed Varnish command: $@"
}

debuglog "Starting varnishd"
/usr/sbin/varnishd -a 127.0.0.1:80 -b 127.0.0.1:8080 -T 127.0.0.1:6082 -S /etc/varnish/secret -P /run/varnishd.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishd"

varnishcommand vcl.load fiddle /fiddle/default.vcl
varnishcommand vcl.use fiddle

debuglog "Starting varnishlog"
varnishlog -D -v -w /fiddle/varnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishlog"

debuglog "Executing requests"
find /fiddle -name request_* -maxdepth 1 -exec /bin/sh -c 'cat {}  | nc 127.0.0.1 80' \; >/dev/null
debuglog "Executed requests"

debuglog "Flushing varnishlog"
kill -s SIGUSR1 $(cat /run/varnishlog.pid)

debuglog "Done"
