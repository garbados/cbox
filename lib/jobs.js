var utils = require('./utils');
var url = require('url');

module.exports = function (job) {
  // determine config location
  var config_path;
  if (job.config) {
    config_path = utils.paths.resolve(job.config);
  } else {
    config_path = utils.config.DEFAULT_CONFIG_PATH;
  }
  // reads the config file, obscuring passwords
  return utils.config.get(config_path) // ensure config exists
    .then(function (config) {
      // obscure passwords
      config.forEach(function (job) {
        var remote_url = url.parse(job.remote);
        if (remote_url.auth) {
          var obscured_auth = [remote_url.auth.split(':')[0], '*****'].join(':');
          var obscured_url = job.remote.replace(remote_url.auth, obscured_auth);
          job.remote = obscured_url;
        }
      });
      return config;
    });
};