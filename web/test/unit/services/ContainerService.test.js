var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

describe('ContainerService', function () {

  describe('#readOutputFiles()', function () {

    it('should return empty responses array when there are no response files', function (done) {
      const testDir = path.join(__dirname, '../../data/empty-run.log-empty-varnishlog');
      ContainerService.for_tests.readOutputFiles(testDir, function (err, output) {
        if (err) return done(err);
        expect(output.responses).to.be.empty;
        done();
      });
    });

    it('should return the content of all expected files', function (done) {
      const testDir = path.join(__dirname, '../../data/full-container-response');
      ContainerService.for_tests.readOutputFiles(testDir, function (err, output) {
        if (err) return done(err);
        expect(output.runlog).to.contain('I am run.log');
        expect(output.varnishlog).to.contain('I am varnishlog');
        expect(output.varnishncsa).to.contain('I am varnishncsa');
        expect(output.responses.length).to.be.at.least(2);
        expect(output.responses[0]).to.contain('I am response_000');
        expect(output.responses[1]).to.contain('I am response_001');
        done();
      });
    });

  });

  describe('#beginReplay()', function () {

    it('should call started callback then completed callback', function (done) {
      this.timeout(5e3);
      var testDir = '/tmp/vclfiddle-testing-' + Math.floor(Math.random() * 0x10000).toString(16);
      fs.mkdirSync(testDir);
      const includedRequests = [{payload: ''}];
      const vclText = '';
      var startedAt = null;
      ContainerService.beginReplay(testDir, includedRequests, vclText, function (err) {
        // started
        if (err) return done(err);
        startedAt = new Date();
      }, function (err) {
        // completed
        if (err) return done(err);
        var completedAt = new Date();
        expect(startedAt).to.not.be.null;
        expect(completedAt).to.be.above(startedAt);
        done();
        rimraf(testDir, function () {});
      });
    });

    it('should capture docker volume mount errors');
    it('should capture run-varnish-container validation errors');
    it('should expose vcl compilation errors so they can be shown to the end users');

  });

});