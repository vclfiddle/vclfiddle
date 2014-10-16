vcl 4.0;

backend default {
    .host = "www.vclfiddle.net"; # TODO handle dns which resolves to multiple IPs like "www.google.com";
    .port = "80";
}

sub vcl_deliver {

  set resp.http.VCLFiddle-Version = "0.0.1";

}