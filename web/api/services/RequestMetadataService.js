var url = require('url');

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
          req.warnings.push('Connection request header not supported.');
        } else {
          req.payload += header.name + ': ' + header.value + '\r\n';
        }
      });
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

module.exports = {

  parseHar: function (rawHar, callback) {

    try {
      var parsedHar = JSON.parse(rawHar);
    } catch (ex) {
      return callback('Failed to parse HAR. ' + ex, rawHar);
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

      var fields = line.split(/\s+/);
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
      var vxid = vxidHeaders.length === 0 ? null : vxidHeaders[0].value;
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