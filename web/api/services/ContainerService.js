var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var temp = require('temp');

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
  child_process.execFile('/opt/vclfiddle/run-varnish-container', [dockerImageName, dirPath], {timeout: dockerTimeoutMillseconds}, function(err, stdout, stderr) {
    if (err) return callback(err);

    sails.log.debug('Docker stdout: ' + stdout);
    sails.log.error('Docker stderr: ' + stderr);

    callback(null);
  });

}

function readOutputFiles(dirPath, callback) {

  fs.readFile(path.join(dirPath, 'run.log'), { encoding: "utf8" }, function (err, runlog) {
    if (err) return callback(err);

    fs.readFile(path.join(dirPath, 'varnishlog'), { encoding: "utf8" }, function (err, varnishlog) {

      callback(null, {runlog: runlog, varnishlog: varnishlog});

    });

  });

}

module.exports = {

  replayRequestsWithVcl: function (includedRequests, vclText, callback) {

    temp.mkdir('fiddle', function (err, dirPath) {

      if (err) return callback(err);

      sails.log.debug('dirPath: ' + dirPath);

      writeInputFiles(dirPath, includedRequests, vclText, function (err) {

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