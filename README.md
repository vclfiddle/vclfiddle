#VclFiddle

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

##Contributors

VclFiddle was started by [Jason Stangroome](https://twitter.com/jstangroome) and
[Daniel Bartholomew](https://twitter.com/dbartholomew) as an opportunity to
learn more about [Docker](https://www.docker.com) and the latest version of
Varnish.

VclFiddle is licensed under the Apache License 2.0 and contributions are
welcome via pull request. There are a number of existing issues available to
work on, and other new ideas and feedback is appreciated.

##Direction

VclFiddle is in its very early stages of life and its future development will
depend upon how it gets used. However our current plans include:

* Providing a mechanism to embed a Fiddle into another webpage.
* Supporting other Varnish versions and popular Varnish modules.
* Displaying more detailed results with more useful visualizations.

You can add comments to existing issues, or submit new issues, to let us know
how you would like VclFiddle to evolve.
