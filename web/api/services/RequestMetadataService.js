var url = require('url');

function convertHarEntriesToRequests (harObject) {
  var requests = [];
  var excludedRequests = [];

  var firstHost = null;

  harObject.log.entries.forEach(function (entry, index) {
    var parsedUrl = url.parse(entry.request.url);
    if (firstHost == null) firstHost = parsedUrl.host;
    if (parsedUrl.host != firstHost) {
      excludedRequests.push({entryIndex: index, reason: 'Ignored', message: 'URL Host does not match first request: ' + parsedUrl.host});
    } else if (parsedUrl.protocol != 'http:') {
      excludedRequests.push({entryIndex: index, reason: 'Unsupported', message: 'Protocol not supported: ' + parsedUrl.protocol});
    } else if (entry.request.httpVersion != 'HTTP/1.0' && entry.request.httpVersion != 'HTTP/1.1') {
      excludedRequests.push({entryIndex: index, reason: 'Unsupported', message: 'HTTP version not supported: ' + entry.request.httpVersion});
    } else if (entry.request.method != 'GET') {
      excludedRequests.push({entryIndex: index, reason: 'Unsupported', message: 'Method not supported: ' + entry.request.method});
    } else {
      var warnings = [];
      var payload = entry.request.method + ' ' + parsedUrl.path + ' ' + entry.request.httpVersion + '\r\n';
      entry.request.headers.forEach(function (header) {
        if (header.name.toLowerCase() == 'connection') {
          warnings.push('Connection request header not supported.');
        } else {
          payload += header.name + ': ' + header.value + '\r\n';
        }
      });
      payload += '\r\n';
      requests.push({entryIndex: index, payload: payload, warnings: warnings});
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

  }

}