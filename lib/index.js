var _ = require('underscore');
var utils = require('./utils');

var modules = {
  // pull: require('./pull'),
  // push: require('./push'),
  // sync: require('./sync'),
  // all:  require('./all'),
  save: require('./save'),
  jobs: require('./jobs'),
  rm: require('./rm')
};

// inherit from to provide access to consistent resolutions of common filepaths or URLs
const DEFAULTS = {
  config: utils.config.DEFAULT_CONFIG_PATH,
  command: undefined,
  watch: false,
  save: false
};

const OPTIONS = {
  remote: undefined,
  local: undefined
};

function Command (name) {
  this.name = name;
  this.cmd = modules[name];

  return this;
}

Command.prototype._extendDefaults = function (options) {
  var new_defaults = _.pick(options, Object.keys(DEFAULTS));
  return _.extend({}, DEFAULTS, new_defaults);
}

Command.prototype._extendOptions = function (options) {
  var new_options = _.pick(options, Object.keys(OPTIONS));
  return _.extend({}, OPTIONS, options);
}

Command.prototype.execWithOptions = function (_options) {
  var defaults = this._extendDefaults(_options);
  var options = this._extendOptions(_options);
  return this.cmd.call(defaults, options);
}

Command.prototype.execWithArgs = function (args, _options) {
  var defaults = this._extendDefaults(_options);
  var options = this._extendOptions(_options);
  return this.cmd.apply(defaults, args.concat(options));
}

function execCommand () {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];
  var options = args[args.length-1];
  var argv = args.slice(1, args.length-1);

  var command = new Command(name);
  if (argv.length) {
    return command.execWithArgs();
  } else {
    return command.execWithOptions(options);
  }
}

module.exports = {
  // push: execCommand.bind(null, 'push'),
  // pull: execCommand.bind(null, 'pull'),
  // sync: execCommand.bind(null, 'sync'),
  // all: execCommand.bind(null, 'all'),
  save: execCommand.bind(null, 'save'),
  jobs: execCommand.bind(null, 'jobs'),
  rm: execCommand.bind(null, 'rm'),
};
