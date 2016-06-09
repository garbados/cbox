# cbox

[![Build Status](https://secure.travis-ci.org/garbados/cbox.png?branch=master)](http://travis-ci.org/garbados/cbox)
[![Coverage Status](https://coveralls.io/repos/garbados/cbox/badge.png)](https://coveralls.io/r/garbados/cbox)
[![Stories in Ready](https://badge.waffle.io/garbados/cbox.png?label=ready)](http://waffle.io/garbados/cbox)
[![NPM version](https://badge.fury.io/js/cbox.png)](http://badge.fury.io/js/cbox)

Maps a file directory into CouchDB attachments, and then pushes, pulls, or syncs with a CouchDB instance. Designed to run forever, consume minimal network traffic, and preserve file history while respecting deletions.

It's like an open-source Dropbox.

## Installation

It's written in [node](https://nodejs.org) so you'll need [npm](https://www.npmjs.com/). Then:

    npm install -g cbox
    cbox # prints commands, usage

As an example, to continually sync a local directory to a CouchDB instance:

    cbox sync --local {folder} --remote {url} --watch

That's it! cbox will watch files on the `remote` database and in the `local` folder, and will sync any changes that occur. To stop syncing, stop the process by pressing `Ctrl-C` or the like. To save that command for the future, use `--save`:

    cbox sync --save --local {folder} --remote {url} --watch
    cbox all # runs all saved jobs

## Commands

* `pull`: pull files from `remote` into `local`
* `push`: push files from `local` up to `remote`
* `sync`: push and pull files from and to `local` and `remote`
* `jobs`: list all saved jobs
* `rm`: remove a saved job, without modifying any remote or local copy
* `all`: run all saved jobs

## Options

* `--local`: a local folder, like `~/Pictures`.
* `--remote`: a remote database, like a CouchDB instance.
* `--save`: save the given command for later re-use.
* `--watch`: continue watching and reacting to changes indefinitely.
* `--config`: path to a non-default file to use for saving and reading configuration values. Defaults to `~/.cbox.json`.
* `--log`: indicates level for logging. Choose from error, warn, info, verbose, debug, and silly.

## Running on Startup

N.B. These instructions are for *nix systems, like Linux and Mac OS X

Using [forever](https://github.com/nodejitsu/forever) and `cron`, you can set cbox to run on a regular basis. Like this:

    npm install -g forever
    echo '@reboot' `which node` `which forever` '--minUptime 1' `which cbox` '--log info' | crontab

That'll run all saved jobs whenever your computer starts. If cbox fails, `forever` will restart it.

## Config

By default, jobs are saved to `~/.cbox.json`. It's just JSON, so you can edit it as you please. If it becomes invalid JSON, cbox will get angry. Here's an example config file:

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
