var expect = require('chai').expect;

describe('CommandLineService', function () {

  describe('#parseCommandLineToArgv()', function () {

    it('should split args at spaces', function (done) {
      CommandLineService.parseCommandLineToArgv('first --second -third 4', function (err, argv) {
        if (err) return done(err);
        expect(argv.length).to.equal(4);
        expect(argv[0]).to.equal('first');
        expect(argv[1]).to.equal('--second');
        expect(argv[2]).to.equal('-third');
        expect(argv[3]).to.equal('4');
        done();
      });
    });

  });
});