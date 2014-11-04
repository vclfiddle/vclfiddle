var path = require('path');

module.exports = {

  one: function (req, res) {
/* vcl:
vcl 4.0; backend default { .host = "www.vclfiddle.net"; .port = "80"; }

sub vcl_backend_response {
  if (beresp.http.Content-Type ~ "^image/") {
    set beresp.http.Cache-Control = "public, max-age=300";
    set beresp.ttl = 300s;
  }
}
*/
/* curl:
curl "http://www.vclfiddle.net/example/one"
*/
    req.session = null; // don't send Set-Cookie: sails.sid=
    return res
      .header('Link', '<https://www.flickr.com/photos/crazymandi/8165527856/>; rel=alternate')
      .header('Cache-Control', 'public, max-age=0')
      .sendfile(path.join(__dirname, 'flickr-crazymandi-puppy.jpg'));
  },

  two: function (req, res) {
/* vcl:
vcl 4.0; backend default { .host = "www.vclfiddle.net"; .port = "80"; }

sub vcl_deliver {
  unset resp.http.Server;
  unset resp.http.X-Powered-By;
}
*/
/* curl:
curl "http://www.vclfiddle.net/example/two"
*/
    return res.send('Where are the Server and X-Powered-By response headers?');
  },

  three: function (req, res) {
/* vcl:
vcl 4.0; backend default { .host = "www.vclfiddle.net"; .port = "80"; }

sub vcl_recv {
  if (req.url == "/example/three") {
    unset req.http.Cookie;
  }
}

sub vcl_backend_response {
  if (bereq.url == "/example/three") {
    unset beresp.http.Set-Cookie;
  }
}
*/
/* curl:
curl "http://www.vclfiddle.net/example/three" -H "Cookie: example-user-session=88c6cee414"
curl "http://www.vclfiddle.net/example/three" -H "Cookie: example-user-session=358dfda63e"
curl "http://www.vclfiddle.net/example/three" -H "Cookie: example-user-session=88c6cee414"
*/
    req.session = null;
    return res
      .header('Set-Cookie', 'example-user-session=f295e3b543; Path=/; HttpOnly')
      .send('This page is not personalised and so a response for one user can safely be served for another even though it sets a session cookie.');
  }

}