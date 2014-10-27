var expect = require('chai').expect;
var request = require('supertest');

describe('VclController', function () {

  describe('#run()', function () {
    it('should require the HAR field to be populated', function (done) {
      request(sails.hooks.http.app)
        .post('/vcl/run')
        .set('Accept', 'application/json')
        .send({ vcl: 'vcl 4.0;', har: '' })
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body.log).to.contain('Failed to parse');
          done();
        });
    });
  });
});