var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var temp = require('temp');
var url = require('url');

function convertHarEntriesToRequests (harObject) {
  var requests = [];
  var excludedRequests = [];

  harObject.log.entries.forEach(function (entry, index) {
    var parsedUrl = url.parse(entry.request.url);
    if (parsedUrl.protocol != 'http:') {
      excludedRequests.push({entryIndex: index, reason: 'Unsupported', message: 'Protocol not supported: ' + parsedUrl.protocol});
    } else if (entry.request.httpVersion != 'HTTP/1.0' && entry.request.httpVersion != 'HTTP/1.1') {
      excludedRequests.push({entryIndex: index, reason: 'Unsupported', message: 'HTTP version not supported: ' + entry.request.httpVersion});
    } else if (entry.request.method != 'GET') {
      excludedRequests.push({entryIndex: index, reason: 'Unsupported', message: 'Method not supported: ' + entry.request.method});
    } else {
      var warnings = [];
      var payload = entry.request.method + ' ' + parsedUrl.path + ' ' + entry.request.httpVersion + '\r\n';
      entry.request.headers.forEach(function (header) {
        if (header.name.toLowerCase() == 'connection') {
          warnings.push('Connection request header not supported.');
        } else {
          payload += header.name + ': ' + header.value + '\r\n';
        }
      });
      payload += '\r\n';
      requests.push({entryIndex: index, payload: payload, warnings: warnings});
    }
  });

  return {
    requests: requests,
    excludedRequests: excludedRequests
  };
}

function countdownCallback(count, onZeroCallback) {
  return function () {
    count--;
    if (count == 0) onZeroCallback();
  };
}

function writeInputFiles (dirPath, requests, vclText, callback) {

    fs.writeFile(path.join(dirPath, 'default.vcl'), vclText, function (err) {
      if (err) return callback(err);

      var success = countdownCallback(requests.length, callback);
      requests.forEach(function (r) {

        var filename = 'request_' + ('000' + r.entryIndex).slice(-3);
        fs.writeFile(path.join(dirPath, filename), r.payload, function (err) {
          if (err) return callback(err);
          success();
        });

      });

    });

}

function runContainer (dirPath, callback) {

  var dockerTimeoutMillseconds = 30 * 1000;
  var dockerImageName = 'varnish4';
  var dockerArgs = ['run', '--rm', '--volume=' + dirPath + ':/fiddle', dockerImageName];
  child_process.execFile('/usr/bin/docker', dockerArgs, {timeout: dockerTimeoutMillseconds}, function(err, stdout, stderr) {
    if (err) return callback(err);

    sails.log.debug('Docker stdout: ' + stdout);
    sails.log.error('Docker stderr: ' + stderr);

    callback(null);
  });

}

function readOutputFiles(dirPath, callback) {

  fs.readFile(path.join(dirPath, 'run.log'), function (err, runlog) {
    if (err) return callback(err);

    fs.readFile(path.join(dirPath, 'varnishlog'), function (err, varnishlog) {

      callback(null, {runlog: runlog, varnishlog: varnishlog});

    });

  });

}

module.exports = {

  replayHarWithVcl: function (harObject, vclText, callback) {
    allRequests = convertHarEntriesToRequests(harObject); // TODO move this function implementation to another service

    temp.mkdir('fiddle', function (err, dirPath) {
      sails.log.debug()

      if (err) return callback(err);

      if (allRequests.requests.length == 0) return callback('HAR does not contain any supported entry requests');

      writeInputFiles(dirPath, allRequests.requests, vclText, function (err) {

        if (err) return callback(err);

        runContainer(dirPath, function (err) {

          if (err) return callback(err);

          readOutputFiles(dirPath, function (err, output) {

            if (err) return callback(err);

            rimraf(dirPath, function () {}); // TODO clean up old failed temp dirs after investigation

            callback(null, output);

          });

        });

      });

    });

  }

};