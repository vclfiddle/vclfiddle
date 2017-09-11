#!/bin/bash

function debuglog {
  echo "$(date '+%Y-%m-%d %T.%3N') $@" >>//fiddle/debug.log
}

function varnishcommand {
  debuglog "Executing Varnish command: $@"
  /usr/local/bin/varnishadm -T 127.0.0.1:6082 -S /etc/varnish/secret $@ >/tmp/varnishcommand.log 2>>/fiddle/run.log ||
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
/usr/local/sbin/varnishd -a 127.0.0.1:80 -b 127.0.0.1:8080 -T 127.0.0.1:6082 -S /etc/varnish/secret -P /run/varnishd.pid -p vcl_trace=on 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishd"

varnishcommand vcl.load fiddle /fiddle/default.vcl
varnishcommand vcl.use fiddle

debuglog "Starting varnishlog"
varnishlog -D -w /tmp/rawvarnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishlog"
debuglog "Starting varnishncsa"
NCSA_FORMAT='%{X-Varnish}o\t%T\t%b\t%{Varnish:time_firstbyte}x\t%{Varnish:hitmiss}x\t%{Varnish:handling}x'
varnishncsa -D -w /fiddle/varnishncsa -P /run/varnishncsa.pid -F "$NCSA_FORMAT" 2>&1 >>/fiddle/run.log || exit $?
#TODO make sure varnishncsa is started and ready to log first request
debuglog "Started varnishncsa"

debuglog "Executing requests"
for ITEM in /fiddle/request_*; do
  executerequest $ITEM
done
debuglog "Executed requests"

debuglog "Flushing varnishlog"
kill -s SIGHUP $(cat /run/varnishlog.pid)
varnishlog -r /tmp/rawvarnishlog >/fiddle/varnishlog

debuglog "Flushing varnishncsa"
kill -s SIGHUP $(cat /run/varnishncsa.pid)

debuglog "Done"
