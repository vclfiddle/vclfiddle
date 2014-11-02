#!/usr/bin/perl -wT
use v5.18.0;
use strict;
use warnings;

die "Usage: $0 IMAGENAME DIRPATH\n" if @ARGV < 2;

my $imageName = $ARGV[0];
my $dirPath = $ARGV[1];

if ($imageName =~ /^(\w+)$/) {
  $imageName = $1; #untaint
} else {
  die "Invalid characters in '$imageName'";
}

if ($dirPath =~ /^(\/tmp\/vclfiddle\-[\w\/\-]+)$/) {
  $dirPath = $1; #untaint
} else {
  die "Invalid characters in '$dirPath'";
}

my $logfile = '/var/log/run-varnish.log';
my $loghandle;
open($loghandle, '>>', $logfile) or die "Could not log to '$logfile': $!";
say $loghandle "imageName:$imageName, dirPath:$dirPath";
close $loghandle;

$ENV{PATH} = "/bin:/usr/bin"; # untaint path
print `/usr/bin/docker run --rm --volume=$dirPath:/fiddle $imageName 2>&1`;
exit $?;