FROM ubuntu:14.04.1
MAINTAINER vclfiddle.net <support@vclfiddle.net>

RUN apt-get update
RUN apt-get install --assume-yes apt-transport-https curl
RUN curl https://repo.varnish-cache.org/ubuntu/GPG-key.txt | apt-key add -
RUN echo "deb https://repo.varnish-cache.org/ubuntu/ trusty varnish-4.1" >> /etc/apt/sources.list.d/varnish-cache.list
RUN apt-get update
RUN apt-get install --assume-yes libvarnishapi1=4.1.8-1~trusty varnish=4.1.8-1~trusty

VOLUME ["/fiddle"]
CMD ["/run.sh"]
ADD run.sh /run.sh
