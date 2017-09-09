FROM ubuntu:16.04
LABEL maintainer "vclfiddle.net <support@vclfiddle.net>"

RUN apt-get update && \
  apt-get install --assume-yes --no-install-recommends \
    automake \
    apt-transport-https \
    apt-utils \
    build-essential \
    ca-certificates \
    curl \
    gcc \
    libc6-dev \
    libc-dev \
    linux-libc-dev \
    libedit-dev \
    libjemalloc-dev \
    libncurses-dev \
    libpcre3-dev \
    libtool \
    netcat \
    pkg-config \
    python-docutils \
    wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Varnish from source, so that Varnish modules can be compiled and installed.
ENV VARNISH_VERSION=5.1.3
ENV VARNISH_SHA256SUM=7439c93ca581340f3722b8c790160f46dc6c5328188e4c0bc233c42f3f04a54e

RUN apt-get update && \
  mkdir -p /usr/local/src && \
  cd /usr/local/src && \
  curl -sfLO http://varnish-cache.org/_downloads/varnish-$VARNISH_VERSION.tgz && \
  echo "${VARNISH_SHA256SUM} varnish-$VARNISH_VERSION.tgz" | sha256sum -c - && \
  tar -xzf varnish-$VARNISH_VERSION.tgz && \
  cd varnish-$VARNISH_VERSION && \
  ./autogen.sh && \
  ./configure && \
  make install && \
  ldconfig && \
  rm ../varnish-$VARNISH_VERSION.tgz && \
  mkdir /etc/varnish

ADD ./secret /etc/varnish/secret

RUN chmod 600 /etc/varnish/secret

VOLUME ["/fiddle"]
CMD ["/run.sh"]
ADD run.sh /run.sh
