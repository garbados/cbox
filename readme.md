# dbox

[![Build Status](https://secure.travis-ci.org/garbados/dbox.png?branch=master)](http://travis-ci.org/garbados/dbox)
[![Coverage Status](https://coveralls.io/repos/garbados/dbox/badge.png)](https://coveralls.io/r/garbados/dbox)
[![Stories in Ready](https://badge.waffle.io/garbados/dbox.png?label=ready)](http://waffle.io/garbados/dbox)
[![NPM version](https://badge.fury.io/js/dbox.png)](http://badge.fury.io/js/dbox)

Maps a file directory into CouchDB attachments, and then pushes, pulls, or syncs with a CouchDB instance. Designed to run forever, consume minimal network traffic

It's like an open-source Dropbox.

## ...dbox?

It stands for Diana Box, *thank you very much.*

## Installation

It's written in [node](https://nodejs.org) so you'll need [npm](https://www.npmjs.com/). Then:

    npm install -g dbox
    dbox # prints commands, usage

As an example, to continually sync a local directory to a CouchDB instance:

    dbox sync --local {folder} --remote {url} --watch

That's it! dbox will watch files on the `remote` database and in the `local` folder, and will sync any changes that occur. To stop syncing, stop the process by pressing `Ctrl-C` or the like. To save that command for the future, use `--save`:

    dbox sync --save --local {folder} --remote {url} --watch
    dbox all # runs all saved jobs

## Commands

* `pull`: pull files from `remote` into `local`
* `push`: push files from `local` up to `remote`
* `sync`: push and pull files from and to `local` and `remote`
* `jobs`: list all saved jobs
* `all`: run all saved jobs

## Options

* `--local`: a local folder, like `~/Pictures`.
* `--remote`: a remote database, like a CouchDB instance.
* `--save`: save the given command for later re-use.
* `--watch`: continue watching and reacting to changes indefinitely.
* `--config`: path to a non-default file to use for saving and reading configuration values. Defaults to `~/.dbox.json`.
* `--log`: indicates level for logging. Choose from error, warn, info, verbose, debug, and silly.

## Running on Startup

N.B. These instructions are for *nix systems, like Linux and Mac OS X

Using [forever](https://github.com/nodejitsu/forever) and `cron`, you can set dbox to run on a regular basis. Like this:

    npm install -g forever
    echo '@reboot' `which node` `which forever` '--minUptime 1' `which dbox` '--log info' | crontab

That'll run all saved jobs whenever your computer starts. If dbox fails, `forever` will restart it.

## Config

By default, jobs are saved to `~/.dbox.json`. It's just JSON, so you can edit it as you please. If it becomes invalid JSON, dbox will get angry. Here's an example config file:

    [
      {
        command: 'pull',
        local: '~/Pictures',
        remote: 'http://localhost:5984/pictures'
      }
    ]

## Tests

The tests sync data with a live CouchDB instance running at `http://localhost:5984`. So, to run the tests, make sure you have an instance listening at that URL.

To run the tests, do `npm test`.

## License

[ISC](https://opensource.org/licenses/ISC)
