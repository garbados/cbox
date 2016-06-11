/**
 * @module  cbox/tasks
 * @description Organizes common patterns into tasks for the CLI like `pull` and `sync`.
 * @example
 * var cbox = require('cbox');
 * var tasks = cbox.tasks;
 * var options = { ... };
 * // execute a common task like `pull`
 * var pullPromise = tasks.pull(options);
 */

var url = require('url');
var _ = require('underscore');
var winston = require('winston');

var utils = require('./utils');
var pull = require('./pull');
// var push = require('./push');
// var sync = require('./sync');


/**
 * Default options for tasks.
 * @type {Object}
 */
const OPTIONS = {
  config: utils.config.DEFAULT_CONFIG_PATH,
  command: undefined,
  watch: false,
  save: false,
  remote: undefined,
  local: undefined,
  n: -1
};

/**
 * @class
 * @description  Encapsulates a common cbox pattern for consistent option handling.
 * @param {Function} cmd A function representing a common cbox pattern
 * @example <caption>How to access Task through cbox.</caption>
 * var cbox = require('cbox');
 * var Task = cbox.tasks.Task;
 * @example <caption>Executing a task with `new Task`.</caption>
 * // the function to wrap, and how to wrap it
 * var cmd = function (options) { ... };
 * var task = new Task(name, cmd);
 * // executing the function with options
 * var options = { ... };
 * var resultPromise = task.exec(options);
 * // process task results
 * resultPromise
 * .catch(function (error) { ... })
 * .then(function (result) { ... });
 * @example <caption>Executing a task with `Task.create`.</caption>
 * // the function to wrap
 * var cmd = function (options) { ... };
 * var task = Task.create(name, cmd);
 * var options = { ... };
 * // executing the function with options
 * var resultPromise = task(options);
 * // process task results
 * resultPromise
 * .catch(function (error) { ... })
 * .then(function (result) { ... });
 */
function Task (cmd) {
  this.cmd = cmd;
}

/**
 * Creates a new Task and returns its exec function.
 * @param  {String} name Name of the task.
 * @param  {Function} cmd  Function that `task.exec` decorates.
 * @return {Function}      Function that executes the created task.
 * @example <caption>Using Task.create to simplify task execution.</caption>
 * var task = Task.create(name, cmd);
 * var promise = task(options);
 * promise
 *   .then(function (result) { ... })
 *   .catch(function (error) { ... })
 */
Task.create = function (cmd) {
  var task = new Task(cmd);
  return task.exec.bind(task);
}

/**
 * Executes `task.cmd` with the supplied options, cleansed and extended by Task defaults.
 * @param  {Object} options Options to supply to `task.cmd`.
 * @return {Promise}          A promise indicating whether the task succeeded.
 */
Task.prototype.exec = function (options) {
  // cleanse and extend supplied options
  var exec_options = _.extend({},
    OPTIONS,                              // first inherit from defaults
    _.pick(options, Object.keys(OPTIONS)) // pluck only relevant keys from supplied options
    );
  return this.cmd(exec_options);
}

exports.Task = Task;

/**
 * Task to pull files from a remote DB to a local directory.
 * @function
 * @param  {Object} options Options to supply to `pull`.
 * @return {Promise}         A promise indicating whether the pull succeeded.
 */
exports.pull = Task.create(function (options) {
  // requires local and remote
  if (!options.local) return Promise.reject(new Error("Command `pull` requires a path to a local directory."));
  if (!options.remote) return Promise.reject(new Error("Command `pull` requires a remote URL."));
  // TODO ensure the remote db exists; log.error if not
  var worker = new pull.worker(options);
  if (options.watch) {
    // if watch=true, feed _changes to a worker.
    var feed = pull.watchRemote(options.remote);
    return worker.fromFeed(feed);
  } else {
    // if !watch=true, get db listing, give to worker
    var list = pull.listRemote(options.remote);
    return worker.fromPromise(list);
  }
});

exports.push = Task.create(function (options) { /* TODO */});
exports.sync = Task.create(function (options) { /* TODO */});
exports.all = Task.create('all', function (options) { /* TODO */});

/**
 * Task to log information about saved jobs.
 * @function
 * @param {Object} options Options to pass to the task.
 * @returns {Promise} A promise describing the results of the task or errors describing its failure.
 */
exports.jobs = Task.create(function (options) {
  // reads the config file, obscuring passwords
  return utils.config.load(options.config)
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
    })
    .then(function (jobs) {
      // log everything!
      winston.info('Listing currently saved jobs:')
      jobs.forEach(function (job, i) {
        winston.info('Job', i+1);
        winston.info('-- command:', job.command);
        winston.info('-- local:', job.local);
        winston.info('-- remote:', job.remote);
        winston.info('-- watch:', job.watch);
      });
      return jobs;
    });
});

/**
 * Task to save a new job.
 * @function
 * @param  {Object} options Options to pass to the task.
 * @return {Promise}        A promise indicating whether the job was successfully saved or not.
 */
exports.save = Task.create(function (options) {
  if (!options.remote) return Promise.reject(new Error("Command `save` requires a remote URL."));
  if (!options.local) return Promise.reject(new Error("Command `save` requires a path to a local directory."));
  if (!options.command) return Promise.reject(new Error("Command `save` requires the name of a command."));

  var job = {
    remote: options.remote,
    local: options.local,
    watch: options.watch,
    command: options.command
  };

  return utils.config.load(options.config)
  .then(function (config) {
    winston.info('Saving job:');
    winston.info('-- command:', job.command);
    winston.info('-- local:', job.local);
    winston.info('-- remote:', job.remote);
    winston.info('-- watch:', job.watch);
    return config.add(job);
  });
});

/**
 * A task for removing saved jobs by index.
 * @function
 * @param  {Object} options Task options, including the integer `options.n` for deleting the `n`th job.
 * @return {Promise}        Promise indicating whether deleting the job succeeded.
 */
exports.rm = Task.create(function (options) {
  if (!options.n) return Promise.reject(new Error("Command `save` requires an integer `n`."));

  return utils.config.load(options.config)
  .then(function (config) {
    winston.info('Removing job', options.n);
    return config.rm(options.n);
  });
});
