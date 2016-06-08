var Promise = require('bluebird');

var path = require('path'),
    fs = Promise.promisifyAll(require('fs'));

var nano = Promise.promisifyAll(require('nano')),
    url = require('url');

var constants = require('./constants');
var paths = require('./paths');
var config = require('./config');

exports.constants = constants;
exports.paths = paths;
exports.config = config;

exports.mkdb = function (job, done) {
  var remote = job.remote;
  var parts = url.parse(remote);
  var instance_url = parts.auth ? 
        parts.protocol + '//' + parts.auth + "@" + parts.host 
        : 
        parts.protocol + '//' + parts.host
        ;
  var instance = nano(instance_url);
  var dbname = parts.pathname.replace(/^\//, '');

  instance.db.create(dbname, function (err, res) {
    if (err && err.status_code !== 412) {
      throw err;
    } else {
      done();
    }
  });
};

exports.mkdirParent = function mkdirParent (dirPath, mode, callback) {
  // Call the standard fs.mkdir
  fs.mkdir(dirPath, mode, function(error) {
    var tasks = [];
    // When it fail in this way, do the custom steps
    if (error && ['EEXIST', 'ENOENT'].indexOf(error.code) !== -1) {
      // Create the directory after...
      tasks.shift(function (done) {
        mkdirParent(dirPath, mode, done);
      });
      // Creating all the parents recursively
      tasks.shift(function (done) {
        mkdirParent(path.dirname(dirPath), mode, done);
      });
    } else {
      // pass along any unexpected errors
      tasks.push(function (done) {
        done(error);
      });
    }
    async.series(tasks, callback);
  });
};
