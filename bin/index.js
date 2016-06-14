#!/usr/bin/env node

var program = require('commander');
var pkg = require('../package.json');
var cbox = require('../lib');
var tasks = cbox.tasks;
var log = cbox.utils.log;


function pruneOptions (program) {
  return {
    command: program.args[0],
    save: program.save || false,
    local: program.local || undefined,
    remote: program.remote || undefined,
    watch: program.watch || false,
    config: program.config
  };
}

function handlePromise (command, promise) {
  return promise
  .then(function (result) {
    log.info('Finished running task:', command);
  })
  .catch(function (error) {
    log.error(error.message);
    if (error.stack) log.error(error.stack);
  });
}

program
  .version(pkg.version)
  .option('-s, --save', 'Save a job to the configuration file but don\'t execute it.')
  .option('-l, --local [PATH]', 'A local folder, like `~/Pictures`')
  .option('-r, --remote [URL]', 'A remote CouchDB instance.')
  .option('-w, --watch', 'Continue watching and reacting to changes indefinitely.')
  .option('-c, --config [PATH]', 'Specify the path to a config file. Defaults to: `~/.cbox.json`');

program
  .command('pull [options]')
  .description('Pull files from `remote` into `local`')
  .action(function (command) {
    var options = pruneOptions(program);
    options.command = 'pull';
    if (options.save) {
      return handlePromise('save', tasks.save(options));
    } else {
      return handlePromise('pull', tasks.pull(options));
    }
  });

program
  .command('push [options]')
  .description('Push files from `local` into `remote`')
  .action(function () {
    var options = pruneOptions(program);
    options.command = 'push';
    if (options.save) {
      return handlePromise('save', tasks.save(options));
    } else {
      return handlePromise('push', tasks.push(options));
    }
  });

program
  .command('sync [options]')
  .description('push and pull files from and to `local` and `remote`')
  .action(function () {
    var options = pruneOptions(program);
    options.command = 'sync';
    if (options.save) {
      return handlePromise('save', tasks.save(options));
    } else {
      return handlePromise('sync', tasks.sync(options));
    }
  });

program
  .command('jobs')
  .description('List all saved jobs')
  .action(function () {
    if (program.log) log.level = program.log;
    var options = pruneOptions(program);
    options.command = 'jobs';
    return handlePromise('jobs', tasks.jobs(options));
  });

program
  .command('rm <n>')
  .description('Delete a saved job with ID `n`')
  .action(function (n) {
    var options = pruneOptions(program);
    options.n = n;
    return handlePromise('rm', tasks.rm(options));
  });

program
  .command('all')
  .description('Execute all saved jobs')
  .action(function () {
    var options = pruneOptions(program);
    options.command = 'all';
    return handlePromise('all', tasks.all(options));
  });

program.parse(process.argv);

// if no command is supplied, print help
if (program.rawArgs.length <= 2) {
  program.outputHelp();
}
