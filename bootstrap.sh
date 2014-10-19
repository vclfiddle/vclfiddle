#!/bin/bash

pushd $(dirname $0) >/dev/null || exit $?
SCRIPTROOT=$(pwd)
popd >/dev/null

# install docker
curl -sSL https://get.docker.io/ubuntu/ | sudo sh

# install nodejs
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install --assume-yes nodejs

# install sails.js
sudo npm install --global sails@0.10.5

# install the web app
sudo rsync -av $SCRIPTROOT/web/ /var/web/
pushd /var/web && sudo npm install && popd

# build the Varnish docker image
sudo docker build --force-rm --tag="varnish4" $SCRIPTROOT/varnish4/

# install the setuid run-varnish-container script
sudo apt-get install --assume-yes gcc
sudo mkdir --parents /opt/vclfiddle/
sudo gcc $SCRIPTROOT/run-varnish-container.c -o /opt/vclfiddle/run-varnish-container
sudo cp $SCRIPTROOT/run-varnish-container.pl /opt/vclfiddle/run-varnish-container.pl
sudo chown root:root /opt/vclfiddle/run-varnish-container*
sudo chmod 04755 /opt/vclfiddle/run-varnish-container
sudo chmod 755 /opt/vclfiddle/run-varnish-container.pl

# launch the sails app
sudo npm install --global forever
cd /var/www && forever start app.js

# TODO install nginx on port 80 to proxy to sails 1337
