var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

describe('FiddlePersistenceService', function () {

  describe('#prepareFiddle()', function () {

    it('should return a new fiddle when the input fiddle is undefined', function (done) {
      var req_body = {};
      FiddlePersistenceService.prepareFiddle(req_body.id, function (err, fiddle) {
        if (err) return done(err);
        expect(fiddle.id).to.match(/^\d{6}-[a-z\d]{7}$/);
        expect(fiddle.path).to.match(/^\/tmp\/vclfiddle-/);
        expect(fiddle.path).to.match(/\/\d+\/?$/);
        fs.stat(fiddle.path, function (err, stats) {
          if (err) return done(err);
          expect(stats.isDirectory()).to.be.true;
          rimraf(path.join(fiddle.path, '..'), done);
        });
      });
    });

    it('should return a new subdir when the input fiddle exists', function (done) {
      var req_body = {};
      FiddlePersistenceService.prepareFiddle(req_body.id, function (err, fiddleA) {
        if (err) return done(err);
        FiddlePersistenceService.prepareFiddle(fiddleA.id, function (err, fiddleB) {
          expect(fiddleB.id).equal(fiddleA.id);
          expect(fiddleB.runIndex).equal(fiddleA.runIndex + 1);
          rimraf(path.join(fiddleA.path, '..'), done);
        });
      });
    });


  });
});