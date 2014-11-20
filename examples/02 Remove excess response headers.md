#Example 2 - Remove excess response headers

##The Problem

You may have a web server which is serving responses with headers containing
information that is useful during testing and debugging but should not be
exposed to the public due to either vanity or a legitimate security concern.

This problem is demonstrated by the following URL:

http://www.vclfiddle.net/example/two

The page served by this URL is accompanied by the following response headers:

```
Server: nginx/1.6.2
X-Powered-By: Sails <sailsjs.org>
```

Perhaps a severe security vulnerability is later found in the NGINX 1.6.2 web
server and you'd rather it wasn't so obvious that your site is vulnerable until
you have time to patch. Or maybe you're just embarrassed to be using Sails.js.
;)

You can see this problem demonstrated in the response headers in this Fiddle:

http://www.vclfiddle.net/141120-0ddd24f/0

With some simple VCL we can address this problem.

##A Solution

This solution involves two lines of VCL in the `vcl_deliver` subroutine, which
is called when a response is served from the origin web server or from Varnish's
cache. This allows us to remove the headers from already cached assets without
needing to purge the cache.

For this example I'm using Varnish 4.0 but the solution is identical in Varnish
3.0.

```
sub vcl_deliver {
  unset resp.http.Server;
  unset resp.http.X-Powered-By;
}
```

The first line removes the `Server` response header, if it exists, from any
responses delivered to the user-agent. The second line does the same but for the
`X-Powered-By` response header instead.

You can see this solution demonstrated in this Fiddle:

http://www.vclfiddle.net/141120-0ddd24f/1

The expand the rows in the transactions view no longer shows either of the
unwanted response headers.