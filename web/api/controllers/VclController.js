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

    var fiddleid = req.params.fiddleid || '';
    var runindex = req.params.runindex || 0;

    return res.view({
      fiddleid: req.params.fiddleid,
      vcl: defaultVcl,
      har: '',
      log: ''
    });
  },

  run: function (req, res) {
    var fiddleid = req.body.fiddleid || '';
    var vcl = req.body.vcl;

    RequestMetadataService.parseHar(req.body.har, function (err, har, allRequests) {

      if (err) {
        return res.ok({
          fiddleid: fiddleid,
          vcl: vcl,
          har: har,
          log: 'Failed to parse HAR. ' + err
        }, 'vcl/index');
      }

      if (allRequests.includedRequests.length == 0) {
        return res.ok({
          fiddleid: fiddleid,
          vcl: vcl,
          har: har,
          log: 'HAR does not contain any supported requests.'
        }, 'vcl/index');
      }

      if (!!req.body.dbl) {
        allRequests.includedRequests = allRequests.includedRequests.concat(allRequests.includedRequests);
      }

      FiddlePersistenceService.prepareFiddle(fiddleid, function (err, fiddle) {
        if (err) return res.serverError(err);

        ContainerService.replayRequestsWithVcl(fiddle.path, allRequests.includedRequests, vcl, function (err, output) {

          var log = '';
          var results = null;
          if (err) {
            log = 'Error: ' + err;
          } else if (output.runlog.length > 0) {
            log = 'Error: ' + output.runlog;
          } else {
            log = output.varnishlog; // TODO parse and format
            var parsedNcsa = RequestMetadataService.parseVarnish4NCSA(output.varnishncsa);
            results = RequestMetadataService.correlateResults(allRequests.includedRequests, output.responses, parsedNcsa, null);
            results = results.concat(allRequests.excludedRequests.map(function (r) { return { request: r }; }));
          }

          return res.ok({
            fiddleid: fiddle.id,
            runindex: fiddle.runIndex,
            vcl: vcl,
            har: har,
            log: log,
            results: results
          }, 'vcl/index');

        });

      });

    });

  }

};

