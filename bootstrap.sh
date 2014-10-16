#!/bin/bash

# install docker
curl -sSL https://get.docker.io/ubuntu/ | sudo sh

# install nodejs
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install --assume-yes nodejs

# install sails.js
npm install --global sails@0.10.5

# install the web app
rsync -av /vagrant/web /var/web
pushd /var/web && npm install && popd

# build the Varnish docker image
sudo docker build --force-rm --tag="varnish4" /vagrant/varnish4/