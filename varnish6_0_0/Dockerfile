FROM ubuntu:16.04
LABEL maintainer "vclfiddle.net <support@vclfiddle.net>"

RUN apt-get update && \
  apt-get install --assume-yes --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl

RUN printf 'deb https://packagecloud.io/varnishcache/varnish60/ubuntu/ xenial main\n' >/etc/apt/sources.list.d/varnish.list && \
  curl -L https://packagecloud.io/varnishcache/varnish60/gpgkey | apt-key add - && \
  apt-get update && \
  apt-get install --assume-yes --no-install-recommends \
    varnish=6.0.0-*

RUN apt-get install --assume-yes --no-install-recommends netcat-openbsd

VOLUME ["/fiddle"]
CMD ["/run.sh"]
ADD run.sh /run.sh
