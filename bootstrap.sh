#!/bin/bash

# install docker
curl -sSL https://get.docker.io/ubuntu/ | sudo sh

# install nodejs
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install --assume-yes nodejs

# install sails.js
npm install --global sails@0.10.5
