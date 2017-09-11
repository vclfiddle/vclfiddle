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
    groff \
    groff-base \
    libc6-dev \
    libc-dev \
    linux-libc-dev \
    libedit-dev \
    libjemalloc-dev \
    libncurses-dev \
    libpcre3-dev \
    libtool \
    make \
    netcat \
    patch \
    pkg-config \
    python-docutils \
    wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Varnish from source, so that Varnish modules can be compiled and installed.
ENV VARNISH_VERSION=2.0.6
ENV VARNISH_SHA256SUM=08c5f6059cb6e2df97d90ddf8e183156faa007121da3b3128678825b4b9fd2eb

RUN apt-get update && \
  mkdir -p /usr/local/src && \
  cd /usr/local/src && \
  curl -sfLO http://varnish-cache.org/_downloads/varnish-$VARNISH_VERSION.tgz && \
  echo "${VARNISH_SHA256SUM} varnish-$VARNISH_VERSION.tgz" | sha256sum -c - && \
  tar -xzf varnish-$VARNISH_VERSION.tgz

COPY ./fix_automake_forwards_incompatibility.patch /usr/local/src/varnish-$VARNISH_VERSION

RUN cd /usr/local/src/varnish-$VARNISH_VERSION && \
  patch ./configure.ac < ./fix_automake_forwards_incompatibility.patch && \
  ./autogen.sh; exit 0

RUN cd /usr/local/src/varnish-$VARNISH_VERSION && \
  ./configure && \
  find . -type f -name 'Makefile.in' -exec sed -i 's:$(mkdir_p):mkdir -vp:g' {} \; && \
  make -j4 && \
  make install && \
  ldconfig && \
  rm ../varnish-$VARNISH_VERSION.tgz && \
  mkdir /etc/varnish

ADD ./secret /etc/varnish/secret

RUN chmod 600 /etc/varnish/secret

VOLUME ["/fiddle"]
CMD ["/run.sh"]
ADD run.sh /run.sh
