var expect = require('chai').expect;

describe('CommandLineService', function () {

  describe('#parseCommandLineToArgv()', function () {

    it('should split args at spaces', function (done) {
      var argv = CommandLineService.parseCommandLineToArgv('first --second -third 4');
      expect(argv.length).to.equal(4);
      expect(argv[0]).to.equal('first');
      expect(argv[1]).to.equal('--second');
      expect(argv[2]).to.equal('-third');
      expect(argv[3]).to.equal('4');
      done();
    });

    it('should handle double-quoted args containing spaces', function (done) {
      var argv = CommandLineService.parseCommandLineToArgv('first "second with space" -third');
      expect(argv.length).to.equal(3);
      expect(argv[0]).to.equal('first');
      expect(argv[1]).to.equal('second with space');
      expect(argv[2]).to.equal('-third');
      done();
    });

    it('should handle single-quoted args containing spaces', function (done) {
      var argv = CommandLineService.parseCommandLineToArgv("first 'second with space' -third");
      expect(argv.length).to.equal(3);
      expect(argv[0]).to.equal('first');
      expect(argv[1]).to.equal('second with space');
      expect(argv[2]).to.equal('-third');
      done();
    });

    it('should handle one double-quoted arg containing spaces', function (done) {
      var argv = CommandLineService.parseCommandLineToArgv('"one with space"');
      expect(argv.length).to.equal(1);
      expect(argv[0]).to.equal('one with space');
      done();
    });

    it('should handle quoted args containing other quotes and spaces', function (done) {
      var argv = CommandLineService.parseCommandLineToArgv('first "space\'s place"   \'home of "the" quote\' ');
      expect(argv.length).to.equal(3);
      expect(argv[0]).to.equal('first');
      expect(argv[1]).to.equal("space's place");
      expect(argv[2]).to.equal('home of "the" quote');
      done();
    });

    it('should handle mid-quoted args', function (done) {
      var argv = CommandLineService.parseCommandLineToArgv('first --second="second value" --third=\'third value\' ');
      expect(argv.length).to.equal(3);
      expect(argv[0]).to.equal('first');
      expect(argv[1]).to.equal('--second=second value');
      expect(argv[2]).to.equal('--third=third value');
      done();
    });

  });
});