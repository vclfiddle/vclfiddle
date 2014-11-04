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
