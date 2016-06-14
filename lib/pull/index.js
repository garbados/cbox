/**
 * @module  cbox/pull
 * @description  Tools for pulling from a remote DB to a local directory.
 */

var Promise = require('bluebird');
var utils = require('../utils');
var winston = require('winston');
var Queue = require('promise-queue');
Queue.configure(Promise);
var PouchDB = require('pouchdb');
var fs = Promise.promisifyAll(require('fs'));
var mime = require('mime');
var crypto = require('crypto');
var hash = crypto.createHash('md5');

/**
 * Lists contents of a remote database.
 * @function
 * @param {String} remote_url URL to the remote database, including credentials.
 * @return {Promise} A promise that resolves to the remote DB's contents as JSON.
 */
function listRemote (remote_url) {
  var db = new PouchDB(remote_url);
  return db.allDocs({
    include_docs: true
  });
}

/**
 * Watch a remote database for changes.
 * @function
 * @param {String} remote_url URL to the remote database, including credentials.
 * @return {Stream} An active stream of changes from the remote DB.
 */
function watchRemote (remote_url) {
  var db = new PouchDB(remote_url);
  return db.changes({
    live: true
  });
}

/**
 * Class for working with files (aka docs) both local and remote.
 * @param {Object} options Options like `filename`, `local`, `remote`.
 * @class
 */
function Doc (options) {
  this.local = options.local;
  this.remote = options.remote;
  this.filename = options.filename;

  this.filepath = utils.paths.join(this.local, this.filename);
  this.mime_type = mime.lookup(this.filepath.toLowerCase());
  this.db = new PouchDB(this.remote);
}

/**
 * Returns a unique hash for a given buffer. Used to compare files.
 * @param  {Buffer} buffer A buffer representing a file's raw data.
 * @return {String}        An Md5 digest string.
 */
Doc.getHash = function (buffer) {
  var digest = hash.update(buffer.toString()).digest('base64');
  return digest;
}

/**
 * Retrieves the raw file data from the remote database.
 * @return {Promise<Buffer>} A promise that resolves to a Buffer object of the raw file data.
 */
Doc.prototype.getRemote = function () {
  return this.db.getAttachment(this.filename, 'file');
};

/**
 * Retrieve metadata from the remote file like its timestamp and stored hash.
 * @return {Promise} A promise that resolves to the remote file's metadata.
 */
Doc.prototype.getRemoteMeta = function () {
  return this.db.get(this.filename);
};

/**
 * Retrieves the raw file data from the local directory.
 * @return {Promise<Buffer>} A promise that resolves to a Buffer object of the raw file data.
 */
Doc.prototype.getLocal = function () {
  return fs.readFileAsync(this.filepath);
};

/**
 * Retrieve metadata from the local file like its timestamp and stored hash.
 * @return {Promise} A promise that resolves to the local file's metadata.
 */
Doc.prototype.getLocalMeta = function () {
  return fs.statAsync(this.filepath);
}

/**
 * Updates the remote file using a Buffer with a file's raw contents.
 * @param  {Buffer} buffer A buffer representing a file's raw contents.
 * @return {Promise}        A promise that indicates whether the update succeeded or failed.
 */
Doc.prototype.putRemote = function (buffer) {
  return this.db.putAttachment(this.filename, 'file', buffer);
};

/**
 * Updates the local file using a Buffer with a file's raw contents.
 * @param  {Buffer} buffer A buffer representing a file's raw contents.
 * @return {Promise}        A promise that indicates whether the update succeeded or failed.
 */
Doc.prototype.putLocal = function (buffer) {
  return fs.writeFileAsync(this.filepath, buffer);
};

Doc.prototype.rmRemote = function () {
  var self = this;
  return this.getRemoteMeta()
  .then(function (meta) {
    return meta._rev;
  })
  .then(function (rev) {
    return self.db.remove(self.filename, rev);
  });
};

Doc.prototype.rmLocal = function () {
  return fs.unlink(this.filepath);
};

/**
 * Compares buffers, indicates whether they're the same.
 * @param {...Buffer} - An array of buffers.
 * @return {Boolean} Whether the supplied buffers match or not.
 */
Doc.prototype.compare = function () {
  var args = Array.prototype.slice.call(arguments);
  return args.map(Doc.getHash).reduce(function (a, b) {
    return a === b;
  });
}

/**
 * @class
 * @param {Object} job Object describing which remote DB to watch, and which local directory to change.
 * @description Manages a task queue indicating files to change.
 */
function LocalWorker (job) {
  this.local = job.local;
  this.remote = job.remote;
  this.db = new PouchDB(this.remote);
  this.queue = new Queue();
}

/**
 * Update a local file from a remote version.
 * @function
 * @param {Doc} doc A document referring to a file.
 * @param {Buffer} buffer Buffer containing the raw contents of a file.
 * @return {Promise} A promise indicating whether the update succeeded.
 */
LocalWorker.prototype.update = function (doc, buffer) {
  // TODO verify timestamp, hash
  return doc.putLocal(buffer);
}

/**
 * Create a local file from a remote version. Creates any folders necessary to completing the file's path.
 * @function
 * @param {Doc} doc A document referring to a file.
 * @param {Buffer} buffer Buffer containing the raw contents of a file.
 * @return {Promise} A promise indicating whether the update succeeded.
 */
LocalWorker.prototype.create = function (doc, buffer) {
  // TODO create directories if necessary
  // TODO this.update(filename, buffer);
}

/**
 * Remove a local file based on a remote version.
 * @function
 * @param {Doc} doc A document referring to a file.
 * @return {Promise} A promise indicating whether the removal succeeded.
 */
LocalWorker.prototype.remove = function (doc) {
  // TODO verify timestamp, hash
  return doc.rmLocal();
}

/**
 * Pulls the current state of a remote database and applies it to the local directory.
 * @return {Promise}         A promise that resolves when the worker has finished pulling.
 */
LocalWorker.prototype.pullOnce = function () {
  var self = this;
  return listRemote(this.remote)
  .then(function (results) {
    return results.rows.map(function (row) {
      return new Doc({
        local: self.local,
        remote: self.remote,
        filename: row.id
      });
    });
  })
  .then(function (docs) {
    var promises = docs.map(function (doc) {
      return doc.getRemote()
      .then(function (buffer) {
        // TODO fallback to self.create if the path to doc.filepath is missing directories
        return self.update(doc, buffer);
      });
    });

    return Promise.all(promises);
  });
}

/**
 * Watches a remote database and pulls any changes to the local directory.
 * @return {Object}      An event emitter that emits events related to the worker pulling and updating files.
 */
LocalWorker.prototype.pullWatch = function () {
  // TODO
}

module.exports = {
  remote: {
    list: listRemote,
    watch: watchRemote
  },
  worker: LocalWorker
};
