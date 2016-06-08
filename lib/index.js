var utils = require('./utils');

var modules = {
  // pull: require('./pull'),
  // push: require('./push'),
  // sync: require('./sync'),
  // all:  require('./all'),
  save: require('./save'),
  jobs: require('./jobs')
};

var commands = {};
Object.keys(modules).forEach(function (command) {
  var cmd = modules[command];
  commands[command] = function (options) {
    // defaults
    options.config = utils.paths.resolve(options.config || utils.config.DEFAULT_CONFIG_PATH);

    return cmd(options);
  };
});

module.exports = commands;
