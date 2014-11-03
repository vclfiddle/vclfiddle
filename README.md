#VclFiddle
=========

VclFiddle is an online tool for experimenting with the
[Varnish Cache](https://www.varnish-cache.org/) HTTP reverse-proxy in a
sandboxed environment. The name comes from a combination of the Varnish
Configuration Language (VCL) and another tool that inspired this project,
[JSFiddle](http://jsfiddle.net).

VclFiddle aims to provide an environment where one can reproduce a website
caching scenario for testing, collaborative debugging, or just trying new ideas,
with the least friction possible.

VclFiddle has just three requirements to use it:

1. An Internet-accessible origin web server to which Varnish will proxy
requests.
1. The VCL to configure the Varnish instance, minimally specifying the address
of the origin web server.
1. The HTTP requests to issue to Varnish for proxying, expressible (currently)
as cURL commands or a HAR-formatted JSON document.

When these items are submitted, VclFiddle will provision an isolated Varnish
instance, configure it, then replay the HTTP requests. The resulting HTTP
response headers and the output of running varnishlog are captured and
displayed. The set of inputs and their outputs are saved, given a Fiddle ID,
and a permalink to this information is made available for sharing.

VclFiddle is hosted at http://www.vclfiddle.net/.
