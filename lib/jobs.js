var utils = require('./utils');
var url = require('url');

module.exports = function (job) {
  // reads the config file, obscuring passwords
  return utils.config.load(job.config, true)
    .then(function (config) {
      // obscure passwords
      config.jobs.forEach(function (job) {
        var remote_url = url.parse(job.remote);
        if (remote_url.auth) {
          var obscured_auth = [remote_url.auth.split(':')[0], '*****'].join(':');
          var obscured_url = job.remote.replace(remote_url.auth, obscured_auth);
          job.remote = obscured_url;
        }
      });
      return config.jobs;
    });
};