var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var paths = require('./paths');
var constants = require('./constants');

/**
 * @class cbox configuration wrapper. Use to get and update config files.
 * @param {Array} jobs     An array of objects describing cbox jobs.
 * @param {String} filepath A relative path to the config's associated filepath, ex: where it came from.
 */
function Config (jobs, filepath) {
  this.jobs = jobs || [];
  this.filepath = Config.resolvePath(filepath);
}

/**
 * Absolute form of cbox's default location for its config.
 * @type {String}
 */
Config.DEFAULT_CONFIG_PATH = [paths.getUserHome(), constants.CONFIG].join('/');

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
 * @param {Boolean} fallback_to_defaults Indicates whether, on failure, load should attempt to fallback to the default config location, and then to an empty config.
 * @return {Promise<Config>}          A promise that resolves to a Config object created from the contents of the read file.
 */
Config.load = function (_filepath, fallback_to_defaults) {
  var filepath = Config.resolvePath(_filepath);
  return fs.statAsync(filepath)
    .then(function (stat) {
      // TODO log this
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
      // throws when reading the file failed, ex: ENOTFOUND
      // TODO log this
      console.log('error loading config file:', _filepath, e);
      // if allowed, try to read from the default file
      if (fallback_to_defaults) {
        // if the given filepath fails, try using the default path
        if (_filepath !== Config.DEFAULT_CONFIG_PATH) {
          // TODO log this
          return Config.load(Config.DEFAULT_CONFIG_PATH, true);
        // if even reading the default failed, return an empty json array
        } else {
          // TODO log this
          return new Config();
        }
      }
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
 * @param {Array} job An array describing a cbox job.
 */
Config.prototype.add = function (job) {
  this.jobs.push(job);
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

/**
 * Returns whether the specified configuration file exists.
 * @param  {String} filepath          A path to the configuration file.
 * @return {Promise<Boolean>}        A promise that resolves to a boolean indicating whether the config exists.
 */
function configExists (filepath) {
  filepath = filepath || DEFAULT_CONFIG_PATH;
  return fs.statAsync(filepath)
    .then(function (stat) {
      return true;
    })
    .catch(function (err) {
      return false;
    });
}

/**
 * Creates a fresh default config at the specified filepath.
 * @param  {String} filepath  A path to the configuration file.
 * @return {Promise}          A promise indicating whether creating the config succeeded or failed.
 */
function createConfig (filepath) {
  filepath = filepath || DEFAULT_CONFIG_PATH;
  return fs.writeFileAsync(filepath, '[]');
}

/**
 * Updates a configuration file with new values, overwriting the old.
 * @param  {String} filepath    A path to the configuration file.
 * @param  {Object[]} config    Array of objects describing quilter jobs.
 * @return {Promise}            A promise indicating whether the update succeeded or failed.
 */
function updateConfig (filepath, config) {
  filepath = filepath || DEFAULT_CONFIG_PATH;
  config_text = JSON.stringify(config);
  return fs.writeFileAsync(filepath, config_text);
}

/**
 * Returns the configuration file's contents as an array. If the config file does not exist, `createConfig` makes a new one.
 * @param  {String} filepath A path to the configuration file.
 * @return {Promise<Object>}          A promise that resolves to an array of objects describing quilter jobs.
 */
function getConfig (filepath) {
  filepath = filepath || DEFAULT_CONFIG_PATH;
  return configExists(filepath)
    .then(function (exists) {
      if (exists) {
        return fs.readFileAsync(filepath, 'utf8')
          .then(function (config_text) {
            return JSON.parse(config_text);
          });
      } else {
        return createConfig(filepath)
          .then(function () {
            return getConfig(filepath);
          });
      }
    })
}

/**
 * Adds a single job to the configuration file, preserving its original contents.
 * @param {String} filepath A path to a config file.
 * @param {Object} options  Information to be added to the config as a job.
 * @return {Promise<Object>} A promise indicating whether adding to the config succeeded.
 */
function addToConfig (filepath, options) {
  filepath = filepath || DEFAULT_CONFIG_PATH;
  var job = {
    command: options.command,
    local: options.local,
    remote: options.remote,
    watch: options.watch
  };
  return getConfig(filepath)
    .then(function (config) {
      config.splice(config.length, 0, job)
      return updateConfig(filepath, config);
    });
}

module.exports = Config;
