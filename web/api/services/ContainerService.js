var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var Q = require('q');

function countdownCallback(count, onZeroCallback) {
  return function () {
    count--;
    if (count == 0) onZeroCallback();
  };
}

function writeInputFiles (dirPath, requests, vclText, callback) {

  if (!(requests instanceof Array) || requests.length == 0) {
    return callback(new Error('At least one request is required'));
  }

  fs.writeFile(path.join(dirPath, 'default.vcl'), vclText, function (err) {
    if (err) return callback(err);

    var success = countdownCallback(requests.length, callback);
    requests.forEach(function (r, index) {

      var filename = 'request_' + ('000' + index).slice(-3);
      fs.writeFile(path.join(dirPath, filename), r.payload, function (err) {
        if (err) return callback(err);
        success();
      });

    });

  });

}

function runContainer (dirPath, dockerImageName, callback) {

  var dockerTimeoutMillseconds = 30 * 1000;
  child_process.execFile('/opt/vclfiddle/run-varnish-container', [dockerImageName, dirPath], {timeout: dockerTimeoutMillseconds}, function(err, stdout, stderr) {
    if (err) return callback(err);

    sails.log.debug('Docker stdout: ' + stdout);
    sails.log.error('Docker stderr: ' + stderr);

    callback(null);
  });

}

function readOutputFiles(dirPath, callback) {

  var readdir = Q.denodeify(fs.readdir);
  var readFile = Q.denodeify(fs.readFile);

  const responseFilePrefix = 'response_';

  var result = {
    runlog: null,
    varnishlog: null,
    varnishncsa: null,
    responses: []
  };

  var runlogPromise = readFile(path.join(dirPath, 'run.log'), { encoding: "utf8" })
    .then(function (data) {
      result.runlog = data;
    });

  var varnishlogPromise = readFile(path.join(dirPath, 'varnishlog'), { encoding: "utf8" })
    .then(function (data) {
      result.varnishlog = data;
    })
    .catch(function (error) { /* swallow */ });

  var varnishncsaPromise = readFile(path.join(dirPath, 'varnishncsa'), { encoding: "utf8" })
    .then(function (data) {
      result.varnishncsa = data;
    })
    .catch(function (error) { /* swallow */ });

  var responsesPromise = readdir(dirPath)
    .then(function (files) {
        return files.filter(function (f) {
          return f.slice(0, responseFilePrefix.length) == responseFilePrefix;
        });
    })
    .then(function (files) {
      return Q.all(
        files.map(function (f) {
          var index = parseInt(f.slice(responseFilePrefix.length), 10);
          return readFile(path.join(dirPath, f), { encoding: "utf8" })
            .then(function (data) {
              result.responses[index] = data;
            });
        })
      );
    });

  return Q.all([runlogPromise, varnishlogPromise, varnishncsaPromise, responsesPromise])
    .then(function () {
      return callback(null, result);
    })
    .catch(callback)
    .done();

}

module.exports = {

  beginReplay: function (dirPath, includedRequests, vclText, dockerImageName, hasStartedCallback, hasCompletedCallback) {

    if (typeof hasCompletedCallback !== 'function') {
      throw new TypeError('Fifth argument "hasCompletedCallback" must be a function.');
    }

    sails.log.debug('Begin replaying requests with vcl in: ' + dirPath);

    writeInputFiles(dirPath, includedRequests, vclText, function (err) {

      if (err) return hasStartedCallback(err);

      runContainer(dirPath, dockerImageName, function (err) {
        sails.log.debug('Run container completed for: ' + dirPath);
        hasCompletedCallback(err, dirPath);
      });

      hasStartedCallback();

    });

  },

  getReplayResult: function (dirPath, callback) {
    fs.readFile(path.join(dirPath, 'completed'), { encoding: "utf8" }, function (err, data) {
      if (err) {
        if (err instanceof Error && err.code === 'ENOENT') {
          // not completed yet
          return callback(null, {});
        }
        sails.log.error(err);
        return callback(new Error('Could not read completion information.'));
      }

      try {
        var completedData = JSON.parse(data);
      } catch (err) {
        sails.log.error(err);
        return callback(new Error('Could not parse completion information.'));
      }

      return callback(null, completedData);

    });
  },

  readOutputFiles: readOutputFiles

};