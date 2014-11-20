#Example 3 - Cache despite session cookies present

##The Problem

Cookies are ever present in modern websites. They serve multiple purposes
including providing analytics, tracking a user's logged in state or the contents
of their shopping cart, their preferred number of results to show on a search
page, and many others.

A web browser will always include existing cookies in requests to a web server
and often web servers will include cookies in all responses to the browser.
Unfortunately, a cache shared by many users, such as a Varnish Cache instance in
front of a web server, cannot determine which cookies are user-specific or which
cookies are required for which requests so the safe default behaviour is to
consider all requests and responses with cookies to be uncacheable.

However, you may be aware of some specific pages on your website that are known
to not contain any user-specific information (regardless of the presence of
cookies) and you would like to be able to serve cached versions of these pages
to multiple users to reduce web server load and give the users a faster
experience.

This problem is demonstrated by the following URL:

http://www.vclfiddle.net/example/three

The page served by this URL is accompanied by the following response header:

`Set-Cookie: example-user-session=...`

The web server is issuing a session tracking cookie so that user-specific
information can be recorded later if needed but this is preventing the caching.
Removing the Set-Cookie response from this page alone isn't enough though
because other user-specific pages will still need to set the cookie and the
browser will return the cookie in the the request to this page.

The impact of the cookies can be seen in the following Fiddle where the page is
requested by one user, then a second user, and finally requested again by the
first user (as simulated by the `-H "Cookie: example-user-session=...` curl
parameter).

http://www.vclfiddle.net/141120-55933cf/0

This Fiddle's results show that all the requests miss the cache. With some
custom VCL we can address this problem.

##A Solution

The solution involves two VCL subroutines each with two lines of VCL. The first
subroutine is `vcl_recv` which is called when a request first arrives from a
user-agent:

```
sub vcl_recv {
  if (req.url == "/example/three") {
    unset req.http.Cookie;
  }
}
```

On the first line we ensure the logic only applies to the page known to be user
agnostic and on the second line we remove the incoming `Cookie` request header
so that Varnish doesn't immediately bypass the cache and will instead see if
an existing response is available to serve.

The second subroutine is `vcl_backend_response` which is called when a response
returns to Varnish from the origin server on a cache miss.

sub vcl_backend_response {
  if (bereq.url == "/example/three") {
    unset beresp.http.Set-Cookie;
  }
}

As before, the first line ensures the logic only applies to the relevant page,
and the second line removed the `Set-Cookie` response header so that Varnish
will consider the response to be cacheable and store it for use serving later
requests.

With this VCL in place, the response from the origin to serve the first user's
request is cached and then is then subsequently used to serve the next two
requests. You can see this demonstrated in this Fiddle:

http://www.vclfiddle.net/141120-55933cf/1

When choosing to implement caching despite the presence of session cookies it
is crucial to be very precise about which resources to apply this behaviour
to as there can be significant security and privacy implications if a page
containing user-specific information is served to another user.