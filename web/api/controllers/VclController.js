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

function completeRun(err, fiddle, allRequests) {

  var completedData = { completedAt: new Date() };

  function writeCompletedData(err) {
    if (err instanceof Error) {
      completedData.error = err.message;
    } else if (err) {
      completedData.error = err.toString();
    }
    fs.writeFile(path.join(fiddle.path, 'completed'), JSON.stringify(completedData), { encoding: 'utf8' }, function (err) {
      if (err) sails.log.error(err);
    });
  }

  if (err) {
    sails.log.error('Run container error: ' + err);
    return writeCompletedData(err);
  }

  ContainerService.readOutputFiles(fiddle.path, function (err, output) {
    if (err) return writeCompletedData(err);
    if (output.runlog.length > 0) return writeCompletedData('Error: ' + output.runlog);

    var parsedNcsa = RequestMetadataService.parseVarnish4NCSA(output.varnishncsa);

    var results = RequestMetadataService.correlateResults(allRequests.includedRequests, output.responses, parsedNcsa, null);
    results = results.concat(allRequests.excludedRequests.map(function (r) { return { request: r }; }));

    completedData.log = output.varnishlog;
    completedData.results = results;
    writeCompletedData();
  });

}

var mandrill = require('mandrill-api/mandrill');

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
        if (err) return res.serverError(err);

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

        FiddlePersistenceService.loadViewState(fiddle, function (err, viewState) {
          if (err) return res.serverError(err);

          viewState.log = completedData.error || completedData.log,
          viewState.results = completedData.results

          FiddlePersistenceService.saveViewState(fiddle, viewState, function (err) {
            if (err) return res.serverError(err);

            return res.ok({
              log: viewState.log,
              results: viewState.results
            });

          });
        });
      });

    });
  },

  run: function (req, res) {
    var fiddleid = req.body.fiddleid || '';
    var vcl = req.body.vcl;
    var rawRequests = req.body.har;
    var dockerImage = req.body.image || 'varnish4';

    const supportedImages = ['varnish4', 'varnish3'];
    if (supportedImages.indexOf(dockerImage) < 0) {
      sails.log.warn('Invalid image parameter:' + dockerImage);
      return res.badRequest();
    }

    if (typeof vcl !== 'string' || typeof rawRequests !== 'string') return res.badRequest();

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

        ContainerService.beginReplay(fiddle.path, allRequests.includedRequests, vcl, dockerImage, function (err) {
          // started

          var viewState = {
            image: dockerImage,
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

        }, function (err) {
          // completed
          return completeRun(err, fiddle, allRequests);
        });

      });

    });

  },

  'send': function (req, res) {

    var params = req.params.all();
    var err = [];
    if(!params.your_name || params.your_name == ''){
      err.push({'your_name':'Your Name is required'});
    }
    if(!params.friend_name || params.friend_name == ''){
      err.push({'friend_name': "Friend's Name is required"});
    }
    if(!params.email || params.email == ''){
      err.push({'email': "Friend's Email is required"});
    }
    if(!params.current_fiddle || params.current_fiddle == ''){
      err.push({'current_fiddle': 'Current Fiddle is required'});
    }
    if (err.length > 0) {
      return res.json( {
          status: 'error',
          message: err
        }
      );
    }

    var msg_text = 'Dear: ' + params.friend_name + ',\n';
    msg_text += params.your_name + ' recommends you to visit the fiddle below: ,\n';
    msg_text += 'Url: ' + params.current_fiddle + '\n';

    var message = {
      to: [{
        email: params.email,
        name: params.friend_name,
        type: 'to'
      }],
      from_email: sails.config.mandrill.from_email,
      from_name: sails.config.mandrill.from_name,
      subject: 'Please visit this fiddle',
      text: msg_text
    };

    var client = new mandrill.Mandrill(sails.config.mandrill.api_key);
    client.messages.send(
      {"message": message, "async": false},
      function(response) {

        if (response.status == 'rejected') { //rejected
          //console.log( JSON.stringify(response) );
          return req.json({
            status: 'error',
            message: response
          });
        }
        else { //success
          return res.json( {
              status: 'success',
              message: 'Email successfully sent'
            }
          );
        }
      },
      function(err) { //error
        return res.json( {
            status: 'error',
            message: err
          }
        );
      }
    );

  }

};

