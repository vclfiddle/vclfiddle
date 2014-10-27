var expect = require('chai').expect;

describe('RequestMetadataService', function () {

  describe('#parseInputRequests()', function () {

    it('should parse a basic curl command', function (done) {
      var argv = RequestMetadataService.parseInputRequests('curl http://www.vclfiddle.net', function (err, input, allRequests) {
        if (err) return done(err);
        expect(allRequests.includedRequests.length).to.equal(1);
        expect(allRequests.includedRequests[0].entryIndex).to.equal(0);
        expect(allRequests.includedRequests[0].summary.method).to.equal('GET');
        expect(allRequests.includedRequests[0].summary.url).to.equal('http://www.vclfiddle.net');
        expect(allRequests.includedRequests[0].summary.httpVersion).to.equal('HTTP/1.1');
        done();
      });
    });

  });

});