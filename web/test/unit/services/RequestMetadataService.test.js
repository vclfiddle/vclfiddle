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
        expect(allRequests.includedRequests[0].payload).to.equal('GET / HTTP/1.1\r\nHost: www.vclfiddle.net\r\n\r\n');
        done();
      });
    });

    it('should parse a curl command with custom headers', function (done) {
      var argv = RequestMetadataService.parseInputRequests('curl --header "Accept: */*" http://www.vclfiddle.net -H \'DNT: 1\'', function (err, input, allRequests) {
        if (err) return done(err);
        expect(allRequests.includedRequests.length).to.equal(1);
        expect(allRequests.includedRequests[0].summary.url).to.equal('http://www.vclfiddle.net');
        expect(allRequests.includedRequests[0].payload).to.contain('Accept: */*\r\n');
        expect(allRequests.includedRequests[0].payload).to.contain('DNT: 1\r\n');
        done();
      });
    });

  });

});