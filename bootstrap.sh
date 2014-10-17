#!/bin/bash

# install docker
curl -sSL https://get.docker.io/ubuntu/ | sudo sh

# install nodejs
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install --assume-yes nodejs

# install sails.js
npm install --global sails@0.10.5

# install the web app
rsync -av /vagrant/web/ /var/web/
pushd /var/web && npm install && popd

# build the Varnish docker image
sudo docker build --force-rm --tag="varnish4" /vagrant/varnish4/

# install the setuid run-varnish-container script
sudo mkdir --parents /opt/vclfiddle/
sudo gcc /vagrant/run-varnish-container.c -o /opt/vclfiddle/run-varnish-container
sudo cp /vagrant/run-varnish-container.pl /opt/vclfiddle/run-varnish-container.pl
sudo chown root:root /opt/vclfiddle/run-varnish-container*
sudo chmod 04755 /opt/vclfiddle/run-varnish-container
sudo chmod 755 /opt/vclfiddle/run-varnish-container.pl
