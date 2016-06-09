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

function execWithOptions (command) {
  return function (options) {
    return modules[command](options);
  }
}

function execWithArg (command) {
  return function (arg, options) {
    return modules[command](arg, options);
  };
}

module.exports = {
  // push: execWithOptions('push'),
  // pull: execWithOptions('pull'),
  // sync: execWithOptions('sync'),
  // all: execWithOptions('all'),
  save: execWithOptions('save'),
  jobs: execWithOptions('jobs'),
  rm: execWithArg('rm')
};
