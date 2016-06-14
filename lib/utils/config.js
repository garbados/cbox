var Promise = require('bluebird');
var _ = require('underscore');
var fs = Promise.promisifyAll(require('fs'));

var paths = require('./paths');
var constants = require('./constants');
var log = require('./log');

/**
 * @class cbox configuration wrapper. Use to get and update config files.
 * @param {Array} jobs     An array of objects describing cbox jobs.
 * @param {String} filepath A relative path to the config's associated filepath, ex: where it came from.
 */
function Config (jobs, filepath) {
  // cleanse supplied
  if (jobs && jobs.length) {
    this.jobs = jobs.map(Config.cleanJob);
  // or use default
  } else {
    this.jobs = [];
  }
  this.filepath = Config.resolvePath(filepath);
}

/**
 * Absolute form of cbox's default location for its config.
 * @type {String}
 */
Config.DEFAULT_CONFIG_PATH = [paths.getUserHome(), constants.CONFIG].join('/');

/**
 * Job description used to cleanse supplied ones.
 * @type {Object}
 */
Config.DEFAULT_JOB = {
  command: undefined,
  local: undefined,
  remote: undefined,
  watch: false
};

/**
 * Cleanse and prune the supplied job to conform to expected parameters.
 * @param  {Object} job An object describing a job.
 * @return {Object}     A new object describing the job.
 */
Config.cleanJob = function (job) {
  return _.extend({}, Config.DEFAULT_JOB, _.pick(job, Object.keys(Config.DEFAULT_JOB)));
}

/**
 * Converts a relative or user-relative path like `~/.cbox.conf` to an absolute path like `/home/garbados/.cbox.conf`.
 * @param  {String} _filepath A relative path to a file. Defaults to `Config.DEFAULT_CONFIG_PATH`.
 * @return {String}           An absolute path to that file.
 */
Config.resolvePath = function (_filepath) {
  return _filepath ? paths.resolve(_filepath) : Config.DEFAULT_CONFIG_PATH;
}

/**
 * Load a config file from the filesystem.
 * @param  {String} filepath A path to a JSON file, which will be interpreted as a config file.
 * @return {Promise<Config>}          A promise that resolves to a Config object created from the contents of the read file.
 */
Config.load = function (_filepath) {
  var filepath = Config.resolvePath(_filepath);
  return fs.statAsync(filepath)
    .then(function (stat) {
      log.info('Retrieved config from', filepath);
      return fs.readFileAsync(filepath, 'utf8');
    })
    .then(function (config_string) {
      var jobs;
      // validate json
      try {
        jobs = JSON.parse(config_string);
      } catch (e) {
        // reject if invalid
        return Promise.reject(e);
      }
      // encapsulate in Config
      return new Config(jobs, filepath);
    })
    .catch(function (e) {
      log.error('error', e.code, 'while loading config file from', _filepath);
      log.error(e.stack);

      return Promise.reject(e);
    });
}

/**
 * Write `this.jobs` as JSON to the configuration file at `this.filepath`.
 * @return {Promise}          A promise describing whether the update succeeded or failed.
 */
Config.prototype.update = function () {
  return fs.writeFileAsync(this.filepath, JSON.stringify(this.jobs));
}

/**
 * Adds one job to the configuration file at `this.filepath`.
 * @param {Object} job An object describing a cbox job.
 */
Config.prototype.add = function (job) {
  var self = this;
  if (job.length) {
    job.map(Config.cleanJob).forEach(self.jobs.push.bind(self.jobs));
  } else {
    this.jobs.push(Config.cleanJob(job));
  }
  return this.update();
};

/**
 * Removes the `n`th job from the configuration file at `this.filepath`. For example, `config.rm(1)` removes the 1st job.
 * @param  {Number} n Integer referencing the ID of the job to remove.
 * @return {Promise}   A promise describing whether removing the job succeeded.
 */
Config.prototype.rm = function (n) {
  this.jobs.splice(n-1, 1);
  return this.update();
};

module.exports = Config;
