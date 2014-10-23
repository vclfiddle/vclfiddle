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
    var runindex = req.params.runindex || '0';

    if (!fiddleid) {
      return res.view({
        fiddleid: '',
        vcl: defaultVcl,
        har: '',
        log: ''
      });
    }

    FiddlePersistenceService.getFiddleRun(fiddleid, runindex, function (err, fiddle) {

      if (err) return res.serverError(err);

      if (fiddle === null) return res.notFound();

      FiddlePersistenceService.loadViewState(fiddle, function (err, viewState) {

        return res.view({
          fiddleid: fiddle.id,
          vcl: viewState.vcl,
          har: viewState.har,
          log: viewState.log,
          results: viewState.results
        })

      });

    });

  },

  run: function (req, res) {
    var fiddleid = req.body.fiddleid || '';
    var vcl = req.body.vcl;
    var rawRequests = req.body.har;

    RequestMetadataService.parseInputRequests(rawRequests, function (err, _ignored, allRequests) {

      if (err) {
        return res.ok({
          fiddleid: fiddleid,
          vcl: vcl,
          har: rawRequests,
          log: 'Failed to parse HAR. ' + err
        }, 'vcl/index');
      }

      if (allRequests.includedRequests.length == 0) {
        return res.ok({
          fiddleid: fiddleid,
          vcl: vcl,
          har: rawRequests,
          log: 'HAR does not contain any supported requests.'
        }, 'vcl/index');
      }

      if (!!req.body.dbl) {
        allRequests.includedRequests = allRequests.includedRequests.concat(allRequests.includedRequests);
      }

      FiddlePersistenceService.prepareFiddle(fiddleid, function (err, fiddle) {
        if (err) return res.serverError(err);

        // TODO persist state of 'replace requests twice' option

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

          var viewState = {
            vcl: vcl,
            har: rawRequests,
            log: log,
            results: results,
          };

          FiddlePersistenceService.saveViewState(fiddle, viewState, function (err) {
            if (err) return res.serverError(err);

            return res.ok({
              fiddleid: fiddle.id,
              runindex: fiddle.runIndex,
              vcl: viewState.vcl,
              har: viewState.har,
              log: viewState.log,
              results: viewState.results
            }, 'vcl/index');

          });

        });

      });

    });

  }

};

