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
/usr/sbin/varnishd -a 127.0.0.1:80 -b 127.0.0.1:8080 -T 127.0.0.1:6082 -S /etc/varnish/secret -P /run/varnishd.pid -p vcl_trace=on 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishd"

varnishcommand vcl.load fiddle /fiddle/default.vcl
varnishcommand vcl.use fiddle

debuglog "Starting varnishlog"
varnishlog -D -w /tmp/rawvarnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
debuglog "Started varnishlog"

debuglog "Executing requests"
for ITEM in /fiddle/request_*; do
  executerequest $ITEM
done
debuglog "Executed requests"

debuglog "Flushing varnishlog"
kill -s SIGHUP $(cat /run/varnishlog.pid)
varnishlog -r /tmp/rawvarnishlog >/fiddle/varnishlog

#If the 1st line started with "storage_file"  it's just the normal start of the varnishd process, remove that line
if [[ $(head -n 1 /fiddle/run.log) == storage_file* ]]; then
   tail -n +2 /fiddle/run.log > /fiddle/run.log
fi

debuglog "Done"
