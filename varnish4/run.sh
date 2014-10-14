#!/bin/bash

/usr/sbin/varnishd -a 127.0.0.1:80 -f /fiddle/default.vcl -P /run/varnishd.pid 2>&1 >>/fiddle/run.log || exit $?

# TODO allow warmup. detect ready.
sleep 2

varnishlog -D -v -w /fiddle/varnishlog -P /run/varnishlog.pid 2>&1 >>/fiddle/run.log || exit $?
sleep 2

curl http://127.0.0.1:80/ # TODO replay HAR twice here

kill -s SIGUSR1 $(cat /run/varnishlog.pid)
sleep 2 # TODO find a better way to wait for flush

kill -s SIGKILL $(cat /run/varnishlog.pid)
kill -s SIGKILL $(cat /run/varnishd.pid)