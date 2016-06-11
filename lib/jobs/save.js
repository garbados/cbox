var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var assert = require('assert');
var utils = require('./utils');

module.exports = function (options) {
  try {
    assert(options.local, 'options requires local');
    assert(options.remote, 'options requires remote');
    assert(options.command, 'options requires command');
  } catch (e) {
    return Promise.reject(e);
  }

  return utils.config.add(options.config, options);
};
