module.exports = {
  parseCommandLineToArgv : function (line) {
    if (typeof line !== 'string') throw new Error('string expected');

    const delimiter = ' ';
    const quotes = ['"', "'"];
    var argv = [];
    var position = 0;
    var lastOpenQuoteIndex = null;
    var textAccumulator = '';
    while (position < line.length) {
      if (lastOpenQuoteIndex === null) {

        var quoteIndices = quotes.map(function (q) {
          return line.indexOf(q, position);
        }).filter(function (index) {
          return index >= 0
        }).sort (function (a, b) {
          return a - b;
        });
        var quoteIndex = quoteIndices.length == 0 ? -1 : quoteIndices[0];

        var delimiterIndex = line.indexOf(delimiter, position);

        if (quoteIndex >= 0 && (quoteIndex < delimiterIndex || delimiterIndex < 0)) {
          // found opening quote before next delimiter, capture text so far, record quote position
          lastOpenQuoteIndex = quoteIndex;
          textAccumulator += line.substring(position, quoteIndex);
          position = quoteIndex + 1;
        } else if (delimiterIndex < 0) {
          // no delimiter found, position to end is the last arg
          argv.push(textAccumulator + line.substring(position));
          textAccumulator = '';
          break;
        } else {
          // delimiter found, there may be more args
          argv.push(textAccumulator + line.substring(position, delimiterIndex));
          textAccumulator = '';
          // move position to next non-delimiter
          position = delimiterIndex + 1;
          while (position < line.length && line.charAt(position) === delimiter) position++;
        }

      } else { // lastOpenQuoteIndex !== null

        var quoteIndex = line.indexOf(line.charAt(lastOpenQuoteIndex), position);
        if (quoteIndex >= 0) {
          lastOpenQuoteIndex = null;
          textAccumulator += line.substring(position, quoteIndex);
          position = quoteIndex + 1;
          if (position === line.length) {
            argv.push(textAccumulator);
            break;
          }
        } else {
          // no close quote found
          // TODO do we assume the open quote was just a literal quote instead?
          lastOpenQuoteIndex = null;
          argv.push(textAccumulator + line.substring(position));
          textAccumulator = '';
          break;
        }

      }
    }
    return argv;
  }
}