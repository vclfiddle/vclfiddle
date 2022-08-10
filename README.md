# VclFiddle

> **Warning**
> https://www.vclfiddle.net/ will soon become unavailable. Please contact the authors if you have questions.

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

## How To Use VclFiddle

**A short video introduction to VclFiddle is available here:**

http://youtu.be/lJ-Rf1L94Sc

<iframe width="560" height="315" src="//www.youtube.com/embed/lJ-Rf1L94Sc" frameborder="0" allowfullscreen></iframe>

VclFiddle exposes a very direct interface to the Varnish instance used
internally. You provide the VCL exactly as you would for a self-managed Varnish
instance and in return you get an unprocessed Varnishlog output.

You can find the documentation for VCL for each Varnish version here:

* [Varnish 4.0](https://www.varnish-cache.org/docs/4.0/reference/vcl.html)
* [Varnish 3.0](https://www.varnish-cache.org/docs/3.0/reference/vcl.html)
* [Varnish 2.1](https://www.varnish-cache.org/docs/2.1/reference/vcl.html)

VclFiddle currently pre-fills the VCL editor with the minimum required for
Varnish 4.0. If you choose another Varnish version instead you will need to
replace the default VCL with the appropriate VCL syntax for your chosen version.

Note that Varnish does not support a backend specified by DNS name if that name
resolves to multiple IP addresses. In this instance, choose one of the possible
IP addresses to specify directly.

Similarly to the VCL, the HTTP requests that will be sent to the Varnish
instance need to be expressed in a direct manner. The first format (of currently
two) supported is the simulated [cURL](http://curl.haxx.se/docs/manpage.html)
command line.

You enter a single cURL command per line and the requests will be executed in
the order specified. There should be enough common cURL arguments recognised
to produce most HTTP requests. If you there are cURL arguments that you need
but are not implemented, please submit an issue on GitHub. To quickly create
cURL commands, you will find 'Copy as cURL' options in the Chrome and Firefox
developer tools.

The second format supported is HTTP Archive, or
[HAR](http://www.softwareishard.com/blog/har-12-spec/). This is a JSON-based
format that is not as easy to hand-craft as cURL. You can obtain HAR from the
Chrome developer tools 'Copy all as HAR' option, from
[Fiddler](http://www.telerik.com/fiddler)'s Export Sessions menu, and several
other tools.

VclFiddle will automatically detect whether you have entered requests using
cURL or HAR format, just don't use a combination of both in one Fiddle.

Some types of requests that are not yet supported will be ignored and this will
be reported in the results. One example is HTTPS requests - these are not
supported because Varnish does not support HTTPS directly. If there are any
request types you need supported (including HTTPS), please raise a GitHub issue.

When using VclFiddle, each Run will use a new instance of Varnish with an empty
cache therefore it is common to perform the specified set of requests twice -
the first time to populate the empty cache, the second time to verify the
expected cache hit or miss behaviour. Rather than expecting you to duplicate
the requests specified manually, VclFiddle offers a 'Replay requests twice'
checkbox which will do this automatically for your convenience.

Once you have specified the VCL and requests to use, click the 'Run' button
at the top of the page to send these to the VclFiddle server for processing.
Within 5 to 10 seconds, or longer for large or many requests, the results will
be displayed. These results will be the raw varnishlog applicable to your chosen
Varnish version and a summary of the HTTP response headers and cache hit/miss
status for each request.

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

##How It Works

VclFiddle consists of a Node.js web application, built with the Sails.js MVC
framework. It is currently hosted with PM2, behind an NGINX proxy.

When the VCL and the cURL (or HAR) are submitted, the application first converts
the requests from their input format to their raw TCP format. A new Fiddle ID
is generated with a corresponding local working directory and the VCL and the
converted requests are written to files in that directory.

Next, a Docker container is started, based on a pre-built image for the
specified Varnish version, with a Docker Volume used to map the Fiddle working
directory into the container.

The container is responsible for starting and configuring a Varnish instance
within itself using the provided VCL file
and then transmitting the raw request files via NetCat to the TCP port within
the container that Varnish is listening on. The container captures the response
headers returned on the TCP connection, saving them to files in the same
volume-mapped directory. The varnishlog is also saved and the container exits.

When the Docker container is done, the web application parses the files
saved into the working directory and makes the information available to the
user.

##Supporting more Varnish versions

VclFiddle currently only supports Varnish 4.0 as provided by the public
Varnish Cache package repository. Support for other Varnish versions, or
compilations, is planned and is intended to implemented by adding more
Docker images following a simple contract.

* Inside the container will be a '/fiddle' directory. When the container starts,
it can expect two sets of items inside this directory:
  * A 'default.vcl' file containing the VCL submitted by the user.
  * A numbered set of 'request_*' files containing the raw HTTP request to be
submitted to the Varnish instance.
* The container's entry process should:
  1. Start Varnish and any other required processes (eg Varnishlog).
  1. Configure Varnish using the '/fiddle/default.vcl' file.
  1. Submit the contents of each '/fiddle/request_*' file to Varnish, in order
of the file's numerical suffix.
  1. Capture the response headers resulting from each request into files named
'/fiddle/response_*' where the suffix corresponds the 'request_*' file suffix.
  1. Record the final output of Varnishlog to '/fiddle/varnishlog'.
  1. Record the final output of Varnishncsa to '/fiddle/varnishncsa'.
  1. Record all critical failures to '/fiddle/run.log'.
  1. Record any diagnostic information to '/fiddle/debug.log'. This will not be
parsed or displayed anywhere.
* A non-empty run.log will cause the Fiddle to be considered failed. The
contents will be reported to the user and all 'response_*' files will be
ignored.
* The 'varnishlog' file will be displayed to the end user in its raw format. It
should at least include the Varnish Transaction Identifier (VXID) to aid manual
correlation with responses.
* The 'response_*' files will be parsed for HTTP response code and headers and
correlated with the request with the same file name index.
* The 'varnishncsa' log will be parsed to determine whether a response was a
cache hit or miss. It should be formatted with tab-delimited fields in this
order :
  1. Value of the 'X-Varnish' response header (ie the VXID).
  1. Total time to serve the request, in seconds.
  1. Total bytes sent to the client (or fallback to response body bytes).
  1. Time until first byte is sent to the client.
  1. Cache hit or miss.
  1. Handling method (ie hit, miss, pass, pipe or error).
* Container run-time limits will eventually be imposed, and a fast user
experience is important, so container start-up overhead should be minimised.
