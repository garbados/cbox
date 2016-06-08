var crypto = require('crypto');
var path = require('path');
var mime = require('mime');

/**
 * Returns a path to the current user's home directory.
 * @return {String} Path to the current user's home directory.
 */
function getUserHome () {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

/**
 * Resolves a relative path into an absolute one.
 * @param  {String} filepath A relative path.
 * @return {String}          An absolute path.
 */
function resolvePath (filepath) {
  if (filepath === '.') filepath = process.cwd();
  return path.normalize(filepath.replace('~', getUserHome()));
}

/**
 * Resolves a file ID to its corresponding local filepath.
 * @param  {String} dirpath Path to the local directory.
 * @param  {String} fileid  ID of a remote file.
 * @return {String}         Path of the corresponding local file.
 */
function getFilePath (dirpath, fileid) {
  return path.join(dirpath, fileid.split(constants.sep).join(path.sep));
}

/**
 * Resolves a filepath to the file ID of the corresponding remote file.
 * @param  {String} filepath A path to a local file.
 * @return {String}          A file ID for the corresponding remote file.
 */
function getFileId (filepath) {
  return filepath
    .split(path.sep)
    .join(constants.sep);
}

/**
 * Resolves the name of a file or the path to it to a MIME type.
 * @param  {String} filepath Name of or path to a file.
 * @return {String}          MIME type.
 */
function getFileType (filepath) {
  return mime.lookup(filepath.toLowerCase());
}

function getMd5Hash (filepath) {
  var hash = crypto.createHash('md5');

  return fs.readFileAsync(f)
    .then(function (buffer) {
      digest = hash.update(buffer.toString()).digest('base64');
    });
}

module.exports = {
  resolve: resolvePath,
  getUserHome: getUserHome,
  getFilePath: getFilePath,
  getFileId: getFileId
};
