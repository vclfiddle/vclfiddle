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

  result: function (req, res) {
    var fiddleid = req.query.fiddleid || '';
    var runindex = req.query.runindex || '0';
    sails.log(req.query);
    if (!fiddleid) return res.badRequest();

    FiddlePersistenceService.getFiddleRun(fiddleid, runindex, function (err, fiddle) {

      if (err) return res.serverError(err);

      if (fiddle === null) return res.notFound();

      ContainerService.getReplayResult(fiddle.path, function (err, completedData) {
        if (err) return res.serverError(err);

        if (!completedData.completedAt) {
          // not complete yet
          // TODO timeout if too long to complete
          // TODO instruct client to cache only briefly if at all
          return res.ok({});
        }

        if (completedData.error) {
          // complete but failed
          return res.ok({
            log: completedData.error
          });
        }

        var output = completedData.result;
        if (output.runlog.length > 0) {
          return res.ok({
            log: 'Error: ' + output.runlog
          });
        }

        var parsedNcsa = RequestMetadataService.parseVarnish4NCSA(output.varnishncsa);

        // TODO recover requests for correlation:
        var results = [];
        //var results = RequestMetadataService.correlateResults(allRequests.includedRequests, output.responses, parsedNcsa, null);
        //results = results.concat(allRequests.excludedRequests.map(function (r) { return { request: r }; }));

        return res.ok({
          log: output.varnishlog,
          results: results
        });

      });

    });
  },

  run: function (req, res) {
    var fiddleid = req.body.fiddleid || '';
    var vcl = req.body.vcl;
    var rawRequests = req.body.har;

    if (!vcl || !rawRequests) return res.badRequest();

    RequestMetadataService.parseInputRequests(rawRequests, function (err, _ignored, allRequests) {

      if (err) {
        return res.ok({
          fiddleid: fiddleid,
          vcl: vcl,
          har: rawRequests,
          log: err.toString()
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

        // TODO persist state of 'replay requests twice' option

        ContainerService.beginReplay(fiddle.path, allRequests.includedRequests, vcl, function (err) {

          var results = null;

          var viewState = {
            vcl: vcl,
            har: rawRequests
          };
          if (err) {
            viewState.log = 'Error: ' + err;
          }

          FiddlePersistenceService.saveViewState(fiddle, viewState, function (err) {
            if (err) return res.serverError(err);

            return res.ok({
              fiddleid: fiddle.id,
              runindex: fiddle.runIndex,
              vcl: viewState.vcl,
              har: viewState.har,
              log: viewState.log
            });

          });

        });

      });

    });

  }

};

