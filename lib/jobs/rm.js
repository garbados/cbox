var Promise = require('bluebird');
var utils = require('./utils');

module.exports = function (n, options) {
  return utils.config.get(options.config)
    .then(function (config) {
      if ((n > config.length) || (n < 0)) {
        return Promise.reject(new Error('`n` did not match the id of any saved job.'));
      } else {
        config.splice(n-1, 1);
        return utils.config.update(options.config, config);
      }
    });
}
