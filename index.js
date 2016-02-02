/**
 * Export cheerio (with )
 */

exports = module.exports = require('./lib/inject-meta');

/*
  Export the version
*/

exports.version = require('./package').version;