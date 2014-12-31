// test.ts
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/debug/debug.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

import chai = require('chai');
import childProcess = require('child_process');
import debug = require('debug');
import path = require('path');

describe('ts-pkg-installer', () => {
  var dlog = debug('ts-pkg-installer:test');
  var expect = chai.expect;
  var script = path.join(process.cwd(), 'bin', 'ts-pkg-installer.sh');
  var testData = path.join(process.cwd(), 'test', 'data');

  function run(args: Array<string>, callback: (error: Error, stdout: string, stderr: string) => void): void {
    // Run the ts-pkg-installer script with specified arguments.

    // Convert stdout and stderr to strings.
    function wrappedCallback(error: Error, stdout: Buffer, stderr: Buffer): void {
      if (error) {
        dlog('error: ' + error.toString());
      }
      dlog('stdout:\n' + stdout.toString());
      dlog('stderr:\n' + stderr.toString());
      callback(error, stdout.toString(), stderr.toString());
    };

    childProcess.execFile(script, args, wrappedCallback);
  }

  // Preserve the current working directory in case a test changes it.
  var cwdSave: string;

  beforeEach(() => {
    cwdSave = process.cwd();
  });

  afterEach(() => {
    process.chdir(cwdSave);
  });

  it('displays usage statement when --help is specified', (done: MochaDone) => {
    run(['--help'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('Usage: ts-pkg-installer');
      done();
    });
  });

  it('displays usage statement when -h is specified', (done: MochaDone) => {
    run(['-h'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.equal('');
      expect(stdout).to.contain('Usage: ts-pkg-installer');
      done();
    });
  });

  it('supports verbose mode (-v)', (done: MochaDone) => {
    run(['-v'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Verbose output');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('supports verbose mode (--verbose)', (done: MochaDone) => {
    run(['--verbose'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Verbose output');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('supports dry run mode (-n)', (done: MochaDone) => {
    run(['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Dry run');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('supports dry run mode (--dry-run)', (done: MochaDone) => {
    run(['-v', '--dry-run'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Dry run');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('skips reading the config file when it does not exists', (done: MochaDone) => {
    // Change to a directory containing no config file.
    process.chdir(path.join(testData, 'none'));
    run(['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Config file not found: tspi.json');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('reads the default config file when it exists', (done: MochaDone) => {
    // Change to a directory containing a config file.
    process.chdir(path.join(testData, 'default'));
    run(['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Read config file: tspi.json');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('reads the specified config file', (done: MochaDone) => {
    var configFile = path.join(testData, 'default', 'tspi.json');
    run(['-v', '-n', '-f', configFile], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Read config file: ' + configFile);
      expect(stdout).to.equal('');
      done();
    });
  });

  it('fails if the specified config file does not exist', (done: MochaDone) => {
    var configFile = 'this/file/does/not/exist';
    run(['-n', '-f', configFile], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.not.equal(null);
      expect(stderr).to.contain('Config file does not exist: ' + configFile);
      expect(stdout).to.equal('');
      done();
    });
  });

  it('reads the default package config file when it exists', (done: MochaDone) => {
    // Current directory contains package.json, so we can run it from here.
    run(['-v', '-n'], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.equal(null);
      expect(stderr).to.contain('ts-pkg-installer Read package config file: package.json');
      expect(stdout).to.equal('');
      done();
    });
  });

  it('fails when no package config exists', (done: MochaDone) => {
    // Point to a config file that points to a nonexistent package config.
    var configFile = path.join(testData, 'no-package-config', 'tspi.json');
    run(['-f', configFile], function (error: Error, stdout: string, stderr: string): void {
      expect(error).to.not.equal(null);
      expect(stderr).to.contain('Package config file could not be read: this/package/config/does/not/exist');
      expect(stdout).to.equal('');
      done();
    });
  });
});
