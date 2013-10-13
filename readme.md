# Quilt [![Build Status](https://secure.travis-ci.org/garbados/quilter.png?branch=master)](http://travis-ci.org/garbados/quilter) [![Stories in Ready](https://badge.waffle.io/garbados/quilter.png?label=ready)](http://waffle.io/garbados/quilter) [![NPM version](https://badge.fury.io/js/quilter.png)](http://badge.fury.io/js/quilter)

Maps a file directory to a CouchDB / Cloudant database.

## Installation

    sudo npm install -g quilter
    quilt init
    # tell quilt what to watch, and where to put it

That's it! Quilt will watch any files in the folder you tell it to watch, and push them to the remote instance whenever they change. Or, you can do this to avoid any prompting:

    quilt init --mount {folder} --remote {url}

For more help, run `quilt -h`.

## Dashboard

**This feature is [in Development](https://github.com/garbados/quilter/issues/3)**

Quilt comes with a dashboard app that lives in whatever instances you sync your files with. This lets you explore, upload, download, and share files. To visit it, launch Quilt, and then go to `_design/dash/_rewrite` in your remote instance. Here's a screenshot:

## Quilting on Startup

**This feature is [in development](https://github.com/garbados/quilter/issues/2).**

    quilt daemon
    # tell quilt what to watch, and where to put it    

Then, when you start your computer, quilt will start watching your files automatically. `quilt daemon` can use the `--mount` and `--remote` options like `quilt init` to skip prompting.

To stop quilt from autostarting, do this:

    quilt undaemon

Without any options, this will remove all `quilt` commands from automatically starting. Use `--mount` and `--remote` to remove only the commands that watch the given folder, and/or push to the given remote instance.

## Tests

The tests sync data with a live CouchDB instance running at `http://localhost:5984`. So, to run the tests, make sure you have an instance listening at that URL.

To run the tests, do `npm test`.

HTTP and filesystem mocks are [in development](https://github.com/garbados/quilter/issues/1).