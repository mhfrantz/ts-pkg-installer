// test.ts
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/debug/debug.d.ts"/>
/// <reference path="../typings/mkdirp/mkdirp.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/ncp/ncp.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="../typings/rimraf/rimraf.d.ts"/>

import chai = require('chai');
import childProcess = require('child_process');
import debug = require('debug');
import fs = require('fs');
import mkdirp = require('mkdirp');
import ncp = require('ncp');
import path = require('path');
import rimraf = require('rimraf');

describe('ts-pkg-installer', () => {
  var dlog = debug('ts-pkg-installer:test');
  var expect = chai.expect;
  var script = path.join(process.cwd(), 'bin', 'ts-pkg-installer.sh');
  var testDataRoot = path.join(process.cwd(), 'test', 'data');
  var nominalTestData = path.join(testDataRoot, 'nominal');
  var rootOutputDir = path.join(process.cwd(), 'o');

  // Copy testData into cwd, and run the ts-pkg-installer script with specified arguments.
  function run(testData: string,
               args: Array<string>,
               callback: (error: Error, stdout: string, stderr: string) => void): void
  {
    // Convert stdout and stderr to strings.
    function wrappedCallback(error: Error, stdout: Buffer, stderr: Buffer): void {
      if (error) {
        dlog('error: ' + error.toString());
      }
      dlog('stdout:\n' + stdout.toString());
      dlog('stderr:\n' + stderr.toString());
      callback(error, stdout.toString(), stderr.toString());
    }

    // Copy the files from the testData directory.
    ncp.ncp(testData, '.', (err: Error): void => {
      if (err) {
        throw err;
      }

      // Run the script.
      childProcess.execFile(script, args, wrappedCallback);
    });
  }

  // Before all of the tests are run, reset the test output directory.
  before((done: MochaDone) => {
    // Remove the entire test output directory
    rimraf(rootOutputDir, (error: Error): void => {
      // Recreate it.
      mkdirp(rootOutputDir, (error: Error): void => {
        done(error);
      });
    });
  });

  // Preserve the current working directory in case a test changes it.
  var cwdSave: string;

  // Generate a unique test output directory.
  var testOutputDir: string;

  // Before each test, create and inhabit a unique test output directory.
  beforeEach(function (done: MochaDone): void {
    cwdSave = process.cwd();

    // Create an empty directory in which to run each test.
    testOutputDir = path.join(rootOutputDir, this.currentTest.fullTitle());
    mkdirp(testOutputDir, (error: Error) => {

      // Change into the test output directory to catch any output.
      if (!error) {
        process.chdir(testOutputDir);
      }

      done(error);
    });
  });

  // Restore the original working directory.
  afterEach(() => {
    process.chdir(cwdSave);
  });

  it('displays usage statement when --help is specified', (done: MochaDone) => {
    run(nominalTestData, ['--help'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('Usage: ts-pkg-installer');
      done();
    });
  });

  it('displays usage statement when -h is specified', (done: MochaDone) => {
    run(nominalTestData, ['-h'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('Usage: ts-pkg-installer');
      done();
    });
  });

  it('supports verbose mode (-v)', (done: MochaDone) => {
    run(nominalTestData, ['-v'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Verbose output');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('supports verbose mode (--verbose)', (done: MochaDone) => {
    run(nominalTestData, ['--verbose'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Verbose output');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('supports dry run mode (-n)', (done: MochaDone) => {
    run(nominalTestData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Dry run');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('supports dry run mode (--dry-run)', (done: MochaDone) => {
    run(nominalTestData, ['-v', '--dry-run'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Dry run');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('skips reading the config file when it does not exists', (done: MochaDone) => {
    // Use a directory containing no config file.
    var testData = path.join(testDataRoot, 'none');
    run(testData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Config file not found: tspi.json');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('reads the default config file when it exists', (done: MochaDone) => {
    // Use a directory containing a config file.
    var testData = path.join(testDataRoot, 'default');
    run(testData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Read config file: tspi.json');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('reads the specified config file', (done: MochaDone) => {
    var configFile = path.join(testDataRoot, 'default', 'tspi.json');
    run(nominalTestData, ['-v', '-n', '-f', configFile], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Read config file: ' + configFile);
      expect(stdout).to.equal('');
      done();
    });
  });

  it('fails if the specified config file does not exist', (done: MochaDone) => {
    var configFile = 'this/file/does/not/exist';
    run(nominalTestData, ['-n', '-f', configFile], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.not.equal(null);
      expect(stderr).to.contain('Config file does not exist: ' + configFile);
      expect(stdout).to.equal('');
      done();
    });
  });

  it('reads the default package config file when it exists', (done: MochaDone) => {
    // Nominal directory contains package.json, so we can run it from here.
    run(nominalTestData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Read package config file: package.json');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('fails when no package config exists', (done: MochaDone) => {
    // Point to a config file that points to a nonexistent package config.
    var configFile = path.join(testDataRoot, 'no-package-config', 'tspi.json');
    run(nominalTestData, ['-f', configFile], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.not.equal(null);
      expect(stderr).to.contain('Package config file could not be read: this/package/config/does/not/exist');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('wraps a nominal main declaration', (done: MochaDone) => {
    run(nominalTestData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Wrapped main declaration file:\n' +
                                '/// <reference path="../../../typings/node/node.d.ts" />\n' +
                                'declare module \'nominal\' {\n' +
                                'export declare function nominal(): void;\n' +
                                '}\n\n');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('wraps a minimal main declaration', (done: MochaDone) => {
    var testData: string = path.join(testDataRoot, 'none');
    run(testData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Wrapped main declaration file:\n' +
                                'declare module \'none\' {\n' +
                                'export declare function index(): void;\n' +
                                '}\n\n');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('wraps an empty main declaration', (done: MochaDone) => {
    var testData: string = path.join(testDataRoot, 'empty-main');
    run(testData, ['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Wrapped main declaration file:\n' +
                                'declare module \'empty-main\' {\n' +
                                '}\n\n');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('fails if no main declaration file exists', (done: MochaDone) => {
    var testData: string = path.join(testDataRoot, 'js-main');
    run(testData, ['-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.not.equal(null);
      expect(stderr).to.contain('Main declaration file could not be wrapped');
      expect(stderr).to.contain('OperationalError: ENOENT, open \'index.d.ts\'');
      expect(stdout).to.equal('');
      done();
    });
  });

});
