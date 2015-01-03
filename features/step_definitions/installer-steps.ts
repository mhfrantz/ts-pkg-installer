// installer-steps.ts
/// <reference path="../../typings/bluebird/bluebird.d.ts"/>
/// <reference path="../../typings/chai/chai.d.ts"/>
/// <reference path="../../typings/debug/debug.d.ts"/>
/// <reference path="../../typings/mkdirp/mkdirp.d.ts"/>
/// <reference path="../../typings/ncp/ncp.d.ts"/>
/// <reference path="../../typings/node/node.d.ts"/>
/// <reference path="../../typings/rimraf/rimraf.d.ts"/>

import BluePromise = require('bluebird');
import chai = require('chai');
import childProcess = require('child_process');
import debug = require('debug');
import fs = require('fs');
import mkdirp = require('mkdirp');
import ncp = require('ncp');
import path = require('path');
import rimraf = require('rimraf');

// ### ICallback
// Interface of the callback from Cucumber.js
interface ICallback {
  (error?: string): void;
  (error?: Error): void;
  pending(): void;
}

// ### IScenario
// Interface of the scenario object from Cucumber.js
interface IScenario {
  getName(): string;
}

// ### IWorld
// Interface to the "world" for these steps.
interface IWorld {
  scenarioName: string;
  testOutputDir: string;
  pkgName: string;

  child: childProcess.ChildProcess;
  error: Error;
  stdout: string;
  stderr: string;
}

function wrapper() {
  var dlog = debug('ts-pkg-installer:steps');
  var expect = chai.expect;
  var testDataRepo = path.join(process.cwd(), 'test', 'data', 'repo');
  var rootOutputDir = path.join(process.cwd(), 'o.features', 'installer');
  var cwdSave = process.cwd();

  // Function which runs a child process and captures the relevant data in the world object.
  var execChild = function (world: IWorld, cwd: string, cmd: string, callback: ICallback) {
    world.child = childProcess.exec(cmd, {'cwd': cwd}, function (error: Error, stdout: Buffer, stderr: Buffer) {
      world.error = error;
      world.stdout = stdout.toString();
      world.stderr = stderr.toString();
      dlog(world.error);
      dlog(world.stdout);
      dlog(world.stderr);
      callback();
    });
  };

  // Set up a test area before each scenario.
  this.Before(function (scenario: IScenario, callback: ICallback) {
    var world = <IWorld> this;
    world.scenarioName = scenario.getName();
    expect(world.scenarioName).to.be.ok;

    // Create a test output area for each scenario.  Replace spaces with underscores to avoid confusing NPM when it is
    // run as a child process.
    world.testOutputDir = path.join(rootOutputDir, world.scenarioName.replace(' ', '_'));

    // Remove the entire test output directory
    rimraf(world.testOutputDir, (error: Error): void => {
      // Recreate it.
      mkdirp(world.testOutputDir, (error: Error): void => {
        // Copy the test data repo for this scenario.
        dlog('Copying test/data/repo for scenario "' + world.scenarioName + '"');
        ncp.ncp(testDataRepo, world.testOutputDir, (err: Error): void => {
          // Change directory to the local copy of the test data repo.
          process.chdir(world.testOutputDir);

          callback(error);
        });
      });
    });
  });

  // Restore the original cwd after each scenario.
  this.After(function (callback: ICallback) {
    dlog('Restoring CWD ' + cwdSave);
    process.chdir(cwdSave);
    callback();
  });

  this.Given(/^an NPM package "([^"]*)" written in TypeScript$/, function (pkg: string, callback: ICallback) {
    // Save the package name for subsequent steps.
    var world = <IWorld> this;
    world.pkgName = pkg;

    // Make sure there is a package with the specified name.
    var pkgConfig: string = path.join(pkg, 'package.json');
    fs.exists(pkgConfig, (exists: boolean): void => {
      expect(exists).to.equal(true);
      // Write code here that turns the phrase above into concrete actions
      callback();
    });
  });

  this.Given(/^a single file "([^"]*)" describing the interface$/, function (file: string, callback: ICallback) {
    // Verify that the file exists.
    var world = <IWorld> this;
    var fullPath: string = path.join(world.pkgName, file);
    fs.exists(fullPath, (exists: boolean): void => {
      expect(exists).to.equal(true);
      callback();
    });
  });

  this.When(/^"([^"]*)" package is installed$/, function (pkg: string, callback: ICallback) {
    // We use the "spine" package to install the other package, since it depends on both leaf packages.
    var world = <IWorld> this;
    var dir = path.join(world.testOutputDir, 'spine');
    dlog('CWD is to be ' + dir);
    dlog('Running npm install ' + world.pkgName);
    execChild(world, dir, 'npm install ' + world.pkgName, callback);
  });

  this.When(/^the TypeScript package installer runs as a postinstall hook$/, function (callback: ICallback) {
    var world = <IWorld> this;
    expect(world.error).to.equal(null);
    expect(world.stdout).to.contain('> ts-pkg-installer');
    callback();
  });

  this.Then(/^"([^"]*)" will be copied into the typings directory\.$/, function (file: string, callback: ICallback) {
    var fullPath = path.join('spine', 'typings', file);
    fs.exists(fullPath, (exists: boolean): void => {
      expect(exists).to.equal(true);
      callback();
    });
  });

  this.Given(/^an NPM package "([^"].*)" under development$/, function (pkg: string, callback: ICallback) {
    var world = <IWorld> this;
    world.pkgName = pkg;
    execChild(world, world.pkgName, 'make install', callback);
  });

  this.When(/^I run tests with "([^"]*)"$/, function (command: string, callback: ICallback) {
    var world = <IWorld> this;
    expect(world.error).to.equal(null);
    execChild(world, world.pkgName, command, callback);
  });

  this.Then(/^the tests will execute\.$/, function (callback: ICallback) {
    var world = <IWorld> this;
    expect(world.error).to.equal(null);
    callback();
  });

  this.Given(/^two NPM packages "([^"]*)" and "([^"]*)" written in TypeScript$/, function (pkg1: string, pkg2: string,
                                                                                           callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^each package depends on Node package described by "([^"]*)"$/, function (file: string,
                                                                                        callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^both packages are installed$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^they will depend on a single copy of "([^"]*)"$/, function (file: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

}

export = wrapper;
