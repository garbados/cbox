#!/usr/bin/env node

var winston = require('winston');
var program = require('commander');
var pkg = require('../package.json');
var cbox = require('../lib');
var tasks = cbox.tasks;


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
    winston.info('Finished running task:', command);
  })
  .catch(function (error) {
    winston.error(error.message);
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
    if (program.log) winston.level = program.log;
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
    tasks.all(options);
  });

program.parse(process.argv);

// var argv = require('optimist').argv,
//     command = argv._[0],
//     quilt = require('../lib'),
//     log = require('winston');

// function on_complete (err, res) {
//   if (err) {
//     log.warn(err);
//   } else {
//     log.info(res || 'success!'); 
//   }
// }

// // set logging level
// if (argv.log) {
//   log.level = argv.log;
// } else {
//   log.level = 'warn';
// }

// // save the given command
// if (argv.save) {
//   // get opts to save
//   var opts = {
//     command: command,
//     local: argv.local,
//     remote: argv.remote,
//     watch: argv.watch
//   };

//   // save to custom config file
//   if (argv.config) {
//     quilt.save(argv.config, opts, on_complete);
//   // or not
//   } else {
//     quilt.save(opts, on_complete);
//   }
// // or, list all jobs
// } else if (command === 'jobs') {
//   quilt.jobs(argv, function (err, res) {
//     if (err) log.warn(err);
//     if (res) console.log(res);
//   });
// // or, execute it instead
// } if (argv.help || (command === 'help')) {

// } else {
//   if (command) {
//     if (command in quilt) {
//       quilt[command](argv, on_complete);
//     } else {
//       log.warn('%s is not a recognized command', command);
//     }
//   } else {
//     quilt.all(argv, on_complete);
//   }
// }