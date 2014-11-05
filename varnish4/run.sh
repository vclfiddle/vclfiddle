#!/bin/bash

function debuglog {
  echo "$(date '+%Y-%m-%d %T.%3N') $@" >>//fiddle/debug.log
}

function varnishcommand {
  debuglog "Executing Varnish command: $@"
  /usr/bin/varnishadm -T 127.0.0.1:6082 -S /etc/varnish/secret $@ >/tmp/varnishcommand.log 2>>/fiddle/run.log ||
    { EXITCODE=$?; cat /tmp/varnishcommand.log >>/fiddle/run.log; exit $EXITCODE; }
  debuglog "Executed Varnish command: $@"
}

function executerequest {
  REQUEST_FILE=$1
  debuglog "Executing request $REQUEST_FILE"
  RESPONSE_FILE=$(basename $REQUEST_FILE)
  RESPONSE_FILE=$(dirname $REQUEST_FILE)/response_${RESPONSE_FILE#request_}
  cat $REQUEST_FILE  | nc 127.0.0.1 80 | sed -e '/^\s*$/,$d' >$RESPONSE_FILE
}

debuglog "Starting varnishd"
/usr/sbin/varnishd -a 127.0.0.1:80 -b 127.0.0.1:8080 -T 127.0.0.1:6082 -S /etc/varnish/secret -P /run/varnishd.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishd"

varnishcommand vcl.load fiddle /fiddle/default.vcl
varnishcommand vcl.use fiddle

debuglog "Starting varnishlog"
varnishlog -D -v -w /fiddle/varnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishlog"

debuglog "Starting varnishncsa"
NCSA_FORMAT='%{X-Varnish}o\t%T\t%O\t%{Varnish:time_firstbyte}x\t%{Varnish:hitmiss}x\t%{Varnish:handling}x'
varnishncsa -D -w /fiddle/varnishncsa -P /run/varnishncsa.pid -F "$NCSA_FORMAT" 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishncsa"

debuglog "Executing requests"
for ITEM in /fiddle/request_*; do
  executerequest $ITEM
done
debuglog "Executed requests"

debuglog "Flushing varnishlog"
kill -s SIGUSR1 $(cat /run/varnishlog.pid)

debuglog "Flushing varnishncsa"
kill -s SIGUSR1 $(cat /run/varnishncsa.pid)

debuglog "Done"
