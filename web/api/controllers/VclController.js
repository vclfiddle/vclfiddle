/**
 * VclController
 *
 * @description :: Server-side logic for managing vcls
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var temp = require('temp');
var url = require('url');

module.exports = {
	index: function (req, res) {
    const defaultVcl = 'vcl 4.0; backend default { .host = "www.vclfiddle.net"; .port = "80"; }';
    return res.view({
      vcl: defaultVcl,
      har: '',
      log: ''
    });
  },

  run: function (req, res) {
    var har = req.body.har;
    var log = "WOO!";

    try {
      var parsedHar = JSON.parse(har);
      var har = JSON.stringify(parsedHar, null, '  ');
    } catch (ex) {
      log = 'Failed to parse HAR. ' + ex;
    }

    var workingDir = temp.mkdirSync('fiddle');
    fs.writeFileSync(path.join(workingDir, 'default.vcl'), req.body.vcl);

    var requestCount = 0;
    if (parsedHar && parsedHar.log.entries.length > 0) {

      parsedHar.log.entries.forEach(function (entry, index) {
        var parsedUrl = url.parse(entry.request.url);
        if (parsedUrl.protocol != 'http:') {
          sails.log('Entry ' + index + ' protocol not supported: ' + parsedUrl.protocol);
        } else if (entry.request.httpVersion != 'HTTP/1.0' && entry.request.httpVersion != 'HTTP/1.1') {
          sails.log('Entry ' + index + ' HTTP version not supported: ' + entry.request.httpVersion);
        } else if (entry.request.method != 'GET') {
          sails.log('Entry ' + index + ' method not supported yet: ' + entry.request.method);
        } else {
          var request = entry.request.method + ' ' + parsedUrl.path + ' ' + entry.request.httpVersion + '\r\n';
          entry.request.headers.forEach(function (header) {
            if (header.name.toLowerCase() == 'connection') {
              sails.log('Entry ' + index + ' "connection" request header not supported yet.');
            } else {
              request += header.name + ': ' + header.value + '\r\n';
            }
          });
          request += '\r\n';
          fs.writeFileSync(path.join(workingDir, 'request_' + requestCount), request); // TODO zero-pad index for sorting
          requestCount++;
        }
      });
    }

    if (requestCount == 0) {
      return res.view('vcl/index', {
        vcl: req.body.vcl,
        har: har,
        log: 'HAR does not contain any support entry requests.'
      });
    }

    var dockerTimeoutMillseconds = 30 * 1000;
    var dockerImageName = 'varnish4';
    //var dockerArgs = ['run', '--rm', '--tty', '--volume=' + workingDir + ':/fiddle', dockerImageName];
    //child_process.execFile('/usr/bin/docker', dockerArgs, {timeout: dockerTimeoutMillseconds}, function(err, stdout, stderr) {
    //var dockerArgs = 'run --rm --volume=' + workingDir + ':/fiddle ' + dockerImageName;
    //child_process.exec('/usr/bin/docker ' + dockerArgs, {timeout: dockerTimeoutMillseconds}, function(err, stdout, stderr) {
    var dockerArgs = ['run', '--rm', '--volume=' + workingDir + ':/fiddle', dockerImageName];
    dockerProcess = child_process.spawn('/usr/bin/docker', dockerArgs);
    dockerProcess.on('error', function(err) {
      log = 'Docker failed. ' + err;
      return res.view('vcl/index', {
        vcl: req.body.vcl,
        har: har,
        log: log
      });
    });
    dockerProcess.on('exit', function(code, signal) {
      log = 'Yeehah! ' + workingDir;
      return res.view('vcl/index', {
        vcl: req.body.vcl,
        har: har,
        log: log
      });

    });

    var junk = function (err, stdout, stderr) {
      if (err) {
        log = 'Docker failed. ' + err;
      } else {
        log = 'Yeehah! ' + workingDir;
      }

      // TODO rimraf workingdir

      return res.view('vcl/index', {
        vcl: req.body.vcl,
        har: har,
        log: log
      });

    };

  }

};

