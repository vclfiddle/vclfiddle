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
  });
});