FROM ubuntu:14.04.1
MAINTAINER vclfiddle.net <support@vclfiddle.net>

RUN apt-get update
RUN apt-get install --assume-yes gcc
#https://repo.varnish-cache.org/ubuntu/pool/varnish-2.1/v/varnish/libvarnish1_2.1.5-1~lucid4_amd64.deb
ADD libvarnish1_2.1.5-1~lucid4_amd64.deb /libvarnish.deb
RUN dpkg -i libvarnish.deb
#https://repo.varnish-cache.org/ubuntu/pool/varnish-2.1/v/varnish/varnish_2.1.5-1~lucid4_amd64.deb
ADD varnish_2.1.5-1~lucid4_amd64.deb /varnish.deb
RUN dpkg -i varnish.deb

VOLUME ["/fiddle"]
CMD ["/run.sh"]
ADD run.sh /run.sh