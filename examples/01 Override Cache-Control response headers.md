#Example 1 - Override Cache-Control response headers

##The Problem

You may have a web server which is serving resources with inappropriate
Cache-Control response headers that are preventing caching,
adding unnecessary load to the web server and giving users a slower experience.

This problem is demonstrated by the following URL:

http://www.vclfiddle.net/example/one

The image served by this URL is accompanied by the following response header:

`Cache-Control: no-store`

The `no-store` value prevents this image, which is expected to change
infrequently, from being cached by Varnish or by browsers.

You can see this problem demonstrated as cache misses by this Fiddle:

http://www.vclfiddle.net/141120-01c334b/0

With some simple VCL we can address this problem.

##A Solution

Rather than fix the Cache-Control response header for this single URL, this
example will demonstrate how to make all images on the site cacheable.

The solution involves three lines of VCL in the `vcl_backend_response`
subroutine, which is called when a response has been received from the upstream
origin server. For this example I'm using Varnish 4.0 but the solution is almost
identical in Varnish 3.0.

```
sub vcl_backend_response {
  if (beresp.http.Content-Type ~ "^image/") {
    set beresp.http.Cache-Control = "public, max-age=300";
    set beresp.ttl = 300s;
  }
}
```

The first line ensures we are only applying the fix to images by checking the
Content-Type response header begins with `image/`.

The second line overwrites the Cache-Control header that Varnish will return to
the browser so that the browser will cache the image for 300 seconds, ie 5
minutes.

The third line overrides the time-to-live for the Varnish object so that it
can be served to other users for the next 5 minutes without forwarding requests
to the origin web server.

You can see this solution demonstrated as a cache hit on the second request in
this Fiddle:

http://www.vclfiddle.net/141120-01c334b/1

The same Fiddle also shows the altered Cache-Control response header when you
expand the rows in the transactions view.