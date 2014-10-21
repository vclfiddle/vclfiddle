var Sails = require('sails');

before(function (done) {
  this.timeout(5 * 1000);
  Sails.lift({
    //config
  }, function (err, sails) {
    if (err) return done(err);
    // load fixtures, etc
    done (err, sails);
  });
});

after(function (done) {
  Sails.lower(done);
});