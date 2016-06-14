/**
 * @module cbox/utils/log
 * A module for serving up cbox's logger
 */

var winston = require('winston');

winston.setLevels(winston.config.syslog.levels);
winston.cli();

/**
 * A winston logger used throughout cbox
 * @type {winston.Logger}
 */
module.exports = winston;
