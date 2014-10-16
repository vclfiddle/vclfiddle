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
    var vcl = req.body.vcl;
    var har = req.body.har;

    try {
      var parsedHar = JSON.parse(har);
      har = JSON.stringify(parsedHar, null, '  ');
    } catch (ex) {

      return res.view('vcl/index', {
        vcl: vcl,
        har: har,
        log: 'Failed to parse HAR. ' + ex
      });

    }

    ContainerService.replayHarWithVcl(parsedHar, vcl, function (err, output) {

      var log = output.varnishlog;
      if (err) {
        log = 'Error: ' + err;
      } else if (output.runlog.length > 0) {
        log = 'Error: ' + output.runlog;
      } else {
        log = output.varnishlog; // TODO parse and format
      }

      return res.view('vcl/index', {
        vcl: vcl,
        har: har,
        log: log
      });


    });

  }

};

