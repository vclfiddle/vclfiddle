var expect = require('chai').expect;
var path = require('path');

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
});