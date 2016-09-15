FROM ubuntu:14.04.1
MAINTAINER vclfiddle.net <support@vclfiddle.net>

RUN apt-get update
RUN apt-get install --assume-yes wget
RUN wget https://repo.varnish-cache.org/pkg/5.0.0-beta1/varnish_5.0.0beta1-2_amd64.deb -O /tmp/varnish_5.0.0beta1-2_amd64.deb
RUN apt-get install --assume-yes libedit2=3.1-20130712-2 libjemalloc1=3.5.1-2 gcc libc6-dev libc-dev linux-libc-dev
RUN dpkg -i /tmp/varnish_5.0.0beta1-2_amd64.deb && apt-get install -f

VOLUME ["/fiddle"]
CMD ["/run.sh"]
ADD run.sh /run.sh
