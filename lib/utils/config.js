var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var url = require('url');

var paths = require('./paths');
var constants = require('./constants');

const DEFAULT_CONFIG_PATH = [paths.getUserHome(), constants.config].join('/');

/**
 * Returns whether the specified configuration file exists.
 * @param  {String} filepath          A path to the configuration file.
 * @return {Promise<Boolean>}        A promise that resolved to a boolean indicating whether the config exists.
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
 * @param {[type]} filepath [description]
 * @param {[type]} job      [description]
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

module.exports = {
  DEFAULT_CONFIG_PATH: DEFAULT_CONFIG_PATH,
  exists: configExists,
  create: createConfig,
  update: updateConfig,
  get: getConfig,
  add: addToConfig
};
