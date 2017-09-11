#!/bin/bash

SCRIPTROOT=/vagrant

#echo "ubuntu:ubuntu" | sudo chpasswd

# install docker
if ! command -v docker >/dev/null; then
  curl -sSL https://get.docker.com/ | sudo sh
fi

# install g++ via build-essential
if ! command -v g++ >/dev/null; then
  sudo apt-get install --assume-yes build-essential
fi

# install nodejs
if ! command -v npm >/dev/null; then
  curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -
  sudo apt-get install --assume-yes nodejs
fi

if ! command -v node-gyp >/dev/null; then
    sudo apt-get install --assume-yes node-gyp
fi

# install sails.js
if ! command -v sails >/dev/null; then
  sudo npm install --global sails@0.10.5
fi

# install the web app
sudo rsync -av $SCRIPTROOT/web/ /var/web/
pushd /var/web && sudo npm install && popd

# build the Varnish docker image
$SCRIPTROOT/varnish5_1_3/build.sh
$SCRIPTROOT/varnish5_0_0/build.sh
$SCRIPTROOT/varnish4_1_8/build.sh
$SCRIPTROOT/varnish4_0_5/build.sh
$SCRIPTROOT/varnish3_0_7/build.sh
$SCRIPTROOT/varnish2_1_5/build.sh
$SCRIPTROOT/varnish2_0_6/build.sh

# install the setuid run-varnish-container script
sudo apt-get install --assume-yes gcc
sudo mkdir --parents /opt/vclfiddle/
sudo gcc $SCRIPTROOT/run-varnish-container.c -o /opt/vclfiddle/run-varnish-container
sudo cp $SCRIPTROOT/run-varnish-container.py /opt/vclfiddle/run-varnish-container.py
sudo chown root:root /opt/vclfiddle/run-varnish-container*
sudo chmod 04755 /opt/vclfiddle/run-varnish-container
sudo chmod 755 /opt/vclfiddle/run-varnish-container.py

# TODO install nginx on port 80 to proxy to sails 1337

# test the app
sudo npm install --global mocha

sudo mkdir --parents /var/lib/vclfiddle/
sudo chown vagrant:adm /var/lib/vclfiddle/
sudo chmod 0775 /var/lib/vclfiddle/

#sudo rsync -av /vagrant/web/ /var/web/ && cd /var/web && sudo npm install && npm test
#sudo rsync -av /vagrant/web/ /var/web/ && cd /var/web && node app.js
