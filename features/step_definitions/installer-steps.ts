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
import debug = require('debug');
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
}

function wrapper() {
  var dlog = debug('ts-pkg-installer:steps');
  var expect = chai.expect;
  var testDataRepo = path.join(process.cwd(), 'test', 'data', 'repo');
  var rootOutputDir = path.join(process.cwd(), 'features', 'o');
  var cwdSave = process.cwd();

  // Set up a test area before each scenario.
  this.Before(function (scenario: IScenario, callback: ICallback) {
    var world = <IWorld> this;
    world.scenarioName = scenario.getName();
    expect(world.scenarioName).to.be.ok;

    // Create a test output area for each scenario.
    world.testOutputDir = path.join(rootOutputDir, world.scenarioName);

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
    process.chdir(cwdSave);
  });

  this.Given(/^an NPM package "([^"]*)" written in TypeScript$/, function (pkg: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^a single file "([^"]*)" describing the interface$/, function (file: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^"([^"]*)" package is installed$/, function (pkg: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^the TypeScript package installer runs as a postinstall hook$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^"([^"]*)" will be copied into the typings directory\.$/, function (file: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^an NPM package "([^"].*)" under development$/, function (pkg: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^I run tests with "([^"]*)"$/, function (command: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^the tests will execute\.$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
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
