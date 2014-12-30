// test.ts
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

import chai = require('chai');
import childProcess = require('child_process');
import path = require('path');

describe('ts-pkg-installer', () => {
  var expect = chai.expect;
  var script = path.join('bin', 'ts-pkg-installer.sh');

  function run(args: Array<string>, callback: (error: Error, stdout: string, stderr: string) => void): void {
    // Run the ts-pkg-installer script with specified arguments.

    // Convert stdout and stderr to strings.
    function wrappedCallback(error: Error, stdout: Buffer, stderr: Buffer): void {
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
});
