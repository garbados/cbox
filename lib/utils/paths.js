var crypto = require('crypto');
var hash = crypto.createHash('md5');
var path = require('path');
var mime = require('mime');

function Paths () {}

/**
 * Returns a path to the current user's home directory.
 * @return {String} Path to the current user's home directory.
 */
Paths.getUserHome = function () {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

/**
 * Resolves a relative path into an absolute one.
 * @param  {String} filepath A relative path.
 * @return {String}          An absolute path.
 */
Paths.resolve = function (filepath) {
  if (filepath === '.') filepath = process.cwd();
  return path.normalize(filepath.replace('~', Paths.getUserHome()));
}

/**
 * Resolves a file ID to its corresponding local filepath.
 * @param  {String} dirpath Path to the local directory.
 * @param  {String} fileid  ID of a remote file.
 * @return {String}         Path of the corresponding local file.
 */
Paths.getFilePath = function (dirpath, fileid) {
  return path.join(dirpath, fileid.split(constants.sep).join(path.sep));
}

/**
 * Resolves a filepath to the file ID of the corresponding remote file.
 * @param  {String} filepath A path to a local file.
 * @return {String}          A file ID for the corresponding remote file.
 */
Paths.getFileId = function (filepath) {
  return filepath
    .split(path.sep)
    .join(constants.sep);
}

/**
 * Resolves the name of a file or the path to it to a MIME type.
 * @param  {String} filepath Name of or path to a file.
 * @return {String}          MIME type.
 */
Paths.getFileType = function (filepath) {
  return mime.lookup(filepath.toLowerCase());
}

/**
 * Verifies integrity on systems without version control by using Md5 hashes.
 * @param  {String} filepath A relative path to the file.
 * @return {String}          A hash digest of the given file's contents.
 */
Paths.getMd5Hash = function (filepath) {
  return fs.readFileAsync(filepath)
    .then(function (buffer) {
      digest = hash.update(buffer.toString()).digest('base64');
      return digest;
    });
}

module.exports = Paths;
