var url = require('url');
var nopt = require('nopt');

function convertHarEntriesToRequests (harObject) {
  var requests = [];
  var excludedRequests = [];

  var firstHost = null;

  harObject.log.entries.forEach(function (entry, index) {
    var parsedUrl = url.parse(entry.request.url);
    if (firstHost == null) firstHost = parsedUrl.host;
    var req = {
      entryIndex: index,
      summary: {
        method: entry.request.method,
        url: entry.request.url,
        httpVersion: entry.request.httpVersion
      }
    };
    if (parsedUrl.host != firstHost) {
      req.excludeReason = 'Ignored';
      req.message = 'URL Host does not match first request: ' + parsedUrl.host;
      excludedRequests.push(req);
    } else if (parsedUrl.protocol != 'http:') {
      req.excludeReason = 'Unsupported';
      req.message = 'Protocol not supported: ' + parsedUrl.protocol;
      excludedRequests.push(req);
    } else if (entry.request.httpVersion != 'HTTP/1.0' && entry.request.httpVersion != 'HTTP/1.1') {
      req.excludeReason = 'Unsupported';
      req.message = 'HTTP version not supported: ' + entry.request.httpVersion;
      excludedRequests.push(req);
    } else if (entry.request.method != 'GET') {
      req.excludeReason = 'Unsupported';
      req.message = 'Method not supported: ' + entry.request.method;
      excludedRequests.push(req);
    } else {
      req.warnings = [];
      req.payload = entry.request.method + ' ' + parsedUrl.path + ' ' + entry.request.httpVersion + '\r\n';
      entry.request.headers.forEach(function (header) {
        if (header.name.toLowerCase() == 'connection') {
          if (header.value.toLowerCase() != 'close') req.warnings.push('Connection request header not supported.');
        } else {
          req.payload += header.name + ': ' + header.value + '\r\n';
        }
      });
      req.payload += 'Connection: close\r\n';
      req.payload += '\r\n';
      requests.push(req);
    }
  });

  return {
    includedRequests: requests,
    excludedRequests: excludedRequests
  };
}

function generateCleanHarText (harObject) {
  return JSON.stringify(harObject, null, '  ');
}

function parseResponse(rawResponse) {
  var lines = rawResponse.split(/\r\n/);
  if (lines.length == 0) return null;
  var responseLine = lines[0];
  var match = responseLine.match(/^([^\s]+)\s(\d{3})\s*(.*)/);
  if (!match) {
    sails.log.debug('Unexpected response line: ' + responseLine);
    return null;
  }

  var responseObject = {
    protocol: match[1],
    code: match[2],
    comment: match[3],
    headers: []
  };

  var lineIndex = 1;
  while (lineIndex < lines.length) {
    match = lines[lineIndex].match(/^([^:]+):\s*(.*)/);
    if (match) {
      responseObject.headers.push({name: match[1], value: match[2]});
    } else if (lines[lineIndex].length > 0) {
      sails.log.debug('Unexpected header line: ' + lines[lineIndex]);
    }
    lineIndex++;
  }
  // TODO consider multi-line headers

  return responseObject;
}

function parseCurlCommands(rawInput, callback) {
  if (typeof rawInput !== 'string' || rawInput.length == 0) {
    return callback(new Error('rawInput is not a string or is empty.'));
  }

  const knownCurlOpts = {
    'header': Array,
    'http1.0': Boolean,
    'data': String,
    'form': String,
    'get': Boolean,
    'head': Boolean,
    'request': String,
    'compressed': Boolean, // ignored for now maybe TODO add Accept-Encoding header if missing
  };
  const knownCurlOptionNames = Object.getOwnPropertyNames(knownCurlOpts);
  const curlShortHands = {
    'H': '--header',
    '0': '--http1.0',
    'd': '--data',
    'F': '--form',
    'G': '--get',
    'I': '--head',
    'X': '--request'
  };

  var firstHost = null;
  var requests = rawInput.split(/\r?\n/)
    .map(function (line, entryIndex) {
      var req = {
        entryIndex: entryIndex,
        summary: {
          method: 'GET',
          url: null,
          httpVersion: 'HTTP/1.1'
        }
      };

      if (!line.match(/^\s*curl\s+/)) {
        sails.log.debug('Line does not begin with a curl command: ' + line);
        return null;
      }

      var thisHost = null;
      var warnings = [];

      var argv = CommandLineService.parseCommandLineToArgv(line);
      var parsed = nopt(knownCurlOpts, curlShortHands, argv, 1);

      if (parsed.argv.remain.length >= 2) {
        warnings.push('Unsupported arguments: ' + parsed.argv.remain.slice(1).join(' '));
      }

      var unsupportedOptions = Object.getOwnPropertyNames(parsed).filter(function (key) {
        if (key === 'argv') return false;
        return knownCurlOptionNames.indexOf(key) < 0;
      }).sort();
      if (unsupportedOptions.length > 0) {
        warnings.push('Unsupported options: ' + unsupportedOptions.join(', '));
      }

      var parsedUrl = {};
      var unparsedUrl = null;
      if (parsed.argv.remain.length >= 1) {
        unparsedUrl = parsed.argv.remain[0];
        parsedUrl = url.parse(unparsedUrl);
        req.summary.url = unparsedUrl;
        thisHost = parsedUrl.host;
      }

      if (parsed.head) {
        req.summary.method = 'HEAD';
      } else if (parsed.request) {
        req.summary.method = parsed.request.toUpperCase();
      } else if ((parsed.data || parsed.form) && !parsed.get) {
        req.summary.method = 'POST';
      }

      if (parsed['http1.0']) {
        req.summary.httpVersion = 'HTTP/1.0';
      }

      var payload = [req.summary.method, parsedUrl.path, req.summary.httpVersion].join(' ') + '\r\n';

      if (parsed.header) {
        // TODO enforce header has 'name: value' pattern
        parsed.header.forEach(function (header) {
          if (header.match(/^\s*connection\s*:/i)) {
            warnings.push('Connection request header not supported.');
          } else {
            var match = header.match(/^\s*host\s*:\s*(.*)/i);
            if (match) thisHost = match[1];
            payload += header + '\r\n';
          }
        });
      }

      if (!payload.match(/^\s*host\s*:/mi)) {
        payload += 'Host: ' + thisHost + '\r\n';
      }
      payload += 'Connection: close\r\n';

      if (firstHost === null) firstHost = thisHost;

      if (!unparsedUrl) {
        req.excludeReason = 'Ignored';
        req.message = 'URL argument missing';
      } else if (!parsedUrl.protocol || !parsedUrl.host || !parsedUrl.path) {
        req.excludeReason = 'Ignored';
        req.message = 'URL argument invalid: ' + unparsedUrl;
      } else if (thisHost !== firstHost) {
        req.excludeReason = 'Ignored';
        req.message = 'URL Host does not match first request: ' + thisHost;
      } else if (parsedUrl.protocol !== 'http:') {
        req.excludeReason = 'Unsupported';
        req.message = 'Protocol not supported: ' + parsedUrl.protocol;
      } else if (req.summary.method !== 'GET') {
        req.excludeReason = 'Unsupported';
        req.message = 'Method not supported: ' + req.summary.method;
      } else if (parsed.data || parsed.form) {
        req.excludeReason = 'Unsupported';
        req.message = 'Request body not supported.'
      } else {
        req.payload = payload + '\r\n';
        req.warnings = warnings;
      }

      return req;
    })
    .filter(function (request) {
      return request !== null;
    });

  var allRequests = {
    includedRequests: [],
    excludedRequests: []
  };

  requests.forEach(function (req) {
    if (req.excludeReason) return allRequests.excludedRequests.push(req);
    allRequests.includedRequests.push(req);
  });

  return callback(null, allRequests);
}

module.exports = {

  parseInputRequests: function (rawInput, callback) {

    try {
      var parsedHar = JSON.parse(rawInput);
    } catch (ex) {
      return parseCurlCommands(rawInput, function (err, allRequests) {
        if (err) {
          sails.log.debug('Failed to parse HAR because ' + ex);
          sails.log.debug('Failed to parse Curl because ' + err);
          return callback(new Error('Failed to parse requests'), rawInput, null);
        }
        return callback(null, rawInput, allRequests);
      });
    }

    return callback(
      null,
      generateCleanHarText(parsedHar),
      convertHarEntriesToRequests(parsedHar)
    );

  },

  parseVarnish4NCSA: function (rawNcsa) {
    if (!rawNcsa) return [];
    var lines = rawNcsa.split(/\n/).filter(function (l) { return !!l; });
    if (lines.length == 0) return [];

    return lines.map(function (line) {

      var result = {
        vxid: null,
        hitmiss: null,
        handling: null,
      };

      var fields = line.split(/\t/);
      try {
        if (fields.length >= 1) result.vxid = fields[0];
        if (fields.length >= 5) result.hitmiss = fields[4];
        if (fields.length >= 6) result.handling = fields[5];
      } catch (ex) {
        sails.log.debug('Failed to parse Varnish4 NCSA log line. ' + ex + '; ' + line);
      }

      if (result.vxid !== null) return result;

    });
  },

  correlateResults: function (includedRequests, responses, parsedNcsa, callback) {

    var results = includedRequests.map(function (req, index) {
      var response = parseResponse(responses[index]);
      var vxidHeaders = response.headers.filter(function (e) { return e.name.toLowerCase() === 'x-varnish'; });
      var vxid = vxidHeaders.length === 0 ? null : vxidHeaders[vxidHeaders.length - 1].value;
      var ncsaRecords = parsedNcsa.filter(function (r) { return r.vxid === vxid });
      var ncsa = ncsaRecords.length === 0 ? null : ncsaRecords[0];
      return {
        request: req,
        response: response,
        vxid: vxid,
        ncsa: ncsa
      };
    });

    return results;
    //callback(null, results);

  }

}
