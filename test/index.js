var Promise = require('bluebird');
var _ = require('underscore');
var assert = require('chai').assert;
var mock_fs = require('mock-fs');
var nock = require('nock'); // TODO use to mock external resources
var PouchDB = require('pouchdb');

var cbox = require('../lib-cov');

// hide 'info' messages
cbox.utils.log.level = 'crit';

// default options
const OPTIONS = {
  local: 'test-fixtures',
  remote: 'http://localhost:5984/cbox-test-fixtures',
  config: 'test-fixtures/config.json',
  watch: false,
  save: false,
  n: -1
};

describe('cbox', function () {
  // mock common files
  before(function () {
    mock_fs({
      'test-fixtures': {
        'config.json': '[]'
      }
    });
  });

  // unmock files
  after(function () {
    mock_fs.restore();
  });

  it('should succeed at this test.', function () {
    // ensures the test suite works at all
    return true;
  });

  describe('tasks', function () {
    describe('#jobs', function () {
      before(function () {
        // save a job
        var options = _.extend({}, OPTIONS, { save: true, watch: true, command: 'sync', remote: 'http://localhost:5984/cbox-test-fixtures' });

        return cbox.utils.config.load(options.config)
        .then(function (config) {
          config.add(options);
        });
      });

      it('should list currently saved jobs', function () {
        // verify that it gets listed
        return cbox.tasks.jobs(OPTIONS)
        .then(function (jobs) {
          assert.equal(jobs.length, 1);
          var job = jobs[0];
          assert.equal(job.local, OPTIONS.local);
          assert.equal(-1, job.remote.indexOf('password')); // ensure password was obscured
          assert.equal(job.watch, true);
          assert.equal(job.command, 'sync');
        });
      });

      after(function () {
        // delete saved job
        return cbox.utils.config.load(OPTIONS.config)
        .then(function (config) {
          config.jobs = [];
          return config.update();
        });
      });
    });

    describe('#rm', function () {
      before(function () {
        // save a job
        var options = _.extend({}, OPTIONS, { save: true, watch: true, command: 'sync' });

        return cbox.utils.config.load(options.config)
        .then(function (config) {
          config.add(options);
        });
      });

      it('should delete a saved job', function () {
        // remove job
        return cbox.tasks.rm({ n: 1, config: OPTIONS.config })
        .then(function () {
          // ensure it was removed
          return cbox.tasks.jobs(OPTIONS);
        })
        .then(function (jobs) {
          assert.equal(jobs.length, 0);
        });
      });
    });

    describe('#save', function () {
      var options = _.extend({}, OPTIONS, { save: true, command: 'pull' });

      it('should save a job', function () {
        return cbox.tasks.save(options)
        .then(function () {
          // ensure it was saved
          return cbox.tasks.jobs(options);
        })
        .then(function (jobs) {
          assert.equal(jobs.length, 1);
        })
      });

      after(function () {
        // delete saved job
        return cbox.utils.config.load(OPTIONS.config)
        .then(function (config) {
          config.jobs = [];
          return config.update();
        });
      });
    });

    describe('#pull', function () {
      // TODO nock; may need to sniff responses and the like
      var db = new PouchDB(OPTIONS.remote);
      var rev = undefined;

      var new_config = [{
                local: OPTIONS.local,
                remote: OPTIONS.remote,
                command: 'push',
                watch: false
              }, {
                local: 'a',
                remote: 'b',
                command: 'push',
                watch: false
              }];

      before(function () {
        // update db with docs to pull
        var new_config_buffer = Buffer(JSON.stringify(new_config));

        return db.put({
          _id: OPTIONS.config.split('/')[1],
          timestamp: Date.now(),
          hash: 'abcdef'
        })
        .then(function (result) {
          return db.putAttachment(result.id, 'file', result.rev, new_config_buffer, 'application/json');
        })
        .then(function (result) {
          rev = result.rev;

          return Promise.resolve();
        });
      });

      it('should pull files from remote database to local directory', function () {
        return cbox.tasks.pull(OPTIONS)
        .then(function (result) {
          // did it successfully modify the local?
          return cbox.utils.config.load(OPTIONS.config)
          .then(function (config) {
            assert.equal(config.jobs.length, new_config.length);
          });
        })
      });

      after(function () {
        // reset affected files
        return db.remove(OPTIONS.config.split('/')[1], rev);
      });
    });

    describe('#push', function () {
      // TODO nock; may need to sniff responses and the like

      it.skip('should push files to remote database from local directory', function () {
        // TODO initiate pull
        // TODO ensure remote data overwrote local
        // .then(function () {
        //   // ensure all expected calls have resolved as expected.
        //   scope.done();
        // });
      });

      after(function () {
        // reset affected files
      });
    });

    describe('#sync', function () {
      var scope = nock(OPTIONS.remote); // TODO

      it.skip('should sync files between remote database and local directory', function () {
        // TODO initiate pull
        // TODO ensure remote data overwrote local
        // .then(function () {
        //   // ensure all expected calls have resolved as expected.
        //   scope.done();
        // });
      });

      after(function () {
        // reset affected files
      });
    });

    describe('#all', function () {
      var scope = nock(OPTIONS.remote); // TODO
      var jobs = [
        _.extend({}, OPTIONS, { command: 'push' }),
        _.extend({}, OPTIONS, { command: 'pull' })
      ];

      before(function () {
        // save jobs
        return cbox.utils.config.load(OPTIONS.config)
        .then(function (config) {
          return config.add(jobs);
        });
      });

      it.skip('should execute all saved jobs', function () {
        // TODO initiate `all`
        // TODO ensure each job had expected effects
        // .then(function () {
        //   // ensure all expected calls have resolved as expected.
        //   scope.done();
        // });
      });

      after(function () {
        // reset affected files
        return cbox.utils.config.load(OPTIONS.config)
        .then(function (config) {
          config.jobs = [];
          return config.update();
        });
      });
    });
  });

  describe('utils', function () {
    describe('config', function () {
      describe('#load', function () {
        var bogus_filepath = 'sup_nerds';
        it('should retrieve a config', function () {
          return cbox.utils.config.load(OPTIONS.config)
            .then(function (config) {
              assert.equal(config.jobs.length, 0);
            });
        });

        it('should fail to retrieve a bogus config', function () {
          return cbox.utils.config.load(bogus_filepath)
            .catch(function (e) {
              assert.equal(e.code, 'ENOENT');
            });
        });
      });
    });
    // describe('constants');
    // describe('paths');
  });
});
