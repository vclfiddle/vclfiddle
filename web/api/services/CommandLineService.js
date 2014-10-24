module.exports = {
  parseCommandLineToArgv : function (line, callback) {
    if (typeof line !== 'string') return callback(new Error('string expected'));
    const delimiter = ' ';
    var argv = [];
    var position = 0;
    while (position < line.length) {
      var delimiterIndex = line.indexOf(delimiter, position);
      if (delimiterIndex < 0) {
        // no delimiter found, position to end is the last arg
        argv.push(line.substring(position));
        break;
      } else {
        // delimiter found, there may be more args
        argv.push(line.substring(position, delimiterIndex));
        // move position to next non-delimiter
        position = delimiterIndex + 1;
        while (position < line.length && line.charAt(position) === delimiterIndex) position++;
      }
    }
    return callback(null, argv);
  }
}