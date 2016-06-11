var pkg = require('../../package.json');

const PROJECT = pkg.name;
const SEPARATOR = '::::';
const CONFIG = '.' + PROJECT + '.conf';

/**
 * @name Constants
 * @class Container for project-wide constants, like project name, file separator, and default config location.
 * All constants are available through static methods and variables, so there should be no need for `new Constants()`.
 */
function Constants () {}

/**
 * Name of the project.
 * @type {String}
 */
Constants.PROJECT = PROJECT;

/**
 * File separator for remote files.
 * @type {String}
 */
Constants.SEPARATOR = SEPARATOR;

/**
 * Default location for cbox's config file.
 * @type {String}
 */
Constants.CONFIG = CONFIG;

module.exports = Constants;
