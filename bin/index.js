#!/usr/bin/env node

var program = require('commander');
var quilter = require('../lib');

function pruneOptions (program) {
  return {
    command: program.args[0],
    save: program.save,
    local: program.local,
    remote: program.remote,
    watch: program.watch,
    config: program.config
  };
}

program
  .version('0.2.1')
  .option('-s, --save', 'Save a job to the configuration file but don\'t execute it.')
  .option('-l, --local [PATH]', 'A local folder, like `~/Pictures`')
  .option('-r, --remote [URL]', 'A remote CouchDB instance.')
  .option('-w, --watch', 'Continue watching and reacting to changes indefinitely.')
  .option('-c, --config [PATH]', 'Specify the path to a config file. Defaults to: `~/.quilter.json`');

program
  .command('pull [options]')
  .description('Pull files from `remote` into `local`')
  .action(function (command) {
    if (options.save) {
      return quilter.save(command, options);
    } else {
      return quilter.pull(command, options);
    }
  });

program
  .command('push [options]')
  .description('Push files from `local` into `remote`')
  .action(function () {
    var options = pruneOptions(program);
    options.command = 'push';
    if (options.save) {
      return quilter.save(options);
    } else {
      return quilter.push(options);
    }
  });

program
  .command('sync [options]')
  .description('push and pull files from and to `local` and `remote`')
  .action(function (command, options) {
    if (options.save) {
      return quilter.save(options);
    } else {
      return quilter.sync(options);
    }
  });

program
  .command('jobs')
  .description('List all saved jobs')
  .action(function () {
    var options = pruneOptions(program);
    quilter
      .jobs(options)
      .then(function (jobs) {
        jobs.forEach(function (job, i) {
          console.log('job', i+1);
          console.log('\t', 'command:', job.command);
          console.log('\t', 'local:', job.local);
          console.log('\t', 'remote:', job.remote);
          if (job.watch) console.log('\t', 'watch:', job.watch);
        });
      });
  });

program
  .command('all')
  .description('Default - Execute all saved jobs')
  .action(function (command, options) {
    // TODO
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