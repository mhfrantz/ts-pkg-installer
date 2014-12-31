// ts-pkg-installer.ts
///<reference path="../typings/commander/commander.d.ts"/>
///<reference path="../typings/bluebird/bluebird.d.ts"/>
///<reference path="../typings/debug/debug.d.ts"/>
///<reference path="../typings/glob/glob.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>

'use strict';

import assert = require('assert');
import BluePromise = require('bluebird');
import commander = require('commander');
import debug = require('debug');
import fs = require('fs');
import glob = require('glob');
import path = require('path');

BluePromise.longStackTraces();

// Command-line options, describing the structure of options in commander.
class Options {
  configFile: string;
  dryRun: boolean;
  verbose: boolean;

  constructor(options: any = {}) {
    this.configFile = options.configFile || 'tspi.json';
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }
}

var defaultOptions = new Options();

// ## CLI
// Define the CLI.
commander
  .option('-f, --config-file <path>', 'Config file [' + defaultOptions.configFile + ']', defaultOptions.configFile)
  .option('-n, --dry-run', 'Dry run (display what would happen without taking action)')
  .option('-v, --verbose', 'Verbose logging')
  .version('1.0.0');

var debugNamespace = 'ts-pkg-installer';
var dlog: debug.Debugger = debug(debugNamespace);

// Name of the configuration file for the node package.
var packageConfigFile = 'package.json';
// Point to the standard location for exported module declarations.
var exportDirGlob = path.join('lib', 'export', '*.d.ts');
// Point to the location where typings will be exported.
var typingsDir = path.join('..', '..', 'typings');

// ## IConfig
// Configuration data from tspi.json
interface IConfig {
}

// ## IPackageConfig
// Configuration data from package.json (the part we care about).
interface IPackageConfig {
}

// ## IFSAsync
interface IFSAsync {
  existsAsync: Function;
  readFileAsync: Function;
}
var fsAsync = <IFSAsync> BluePromise.promisifyAll(fs);

// ## TypeScriptPackageInstaller
// Used as the NPM postinstall script, this will do the following:
// - Read configuration from tspi.json (or options.configFile)
// - Wrap the exported declaration file(s)
// - Copy the exported declaration file(s) to the "typings" directory
class TypeScriptPackageInstaller {

  private options: Options;
  private config: IConfig;
  private packageConfig: IPackageConfig;

  constructor (options: Options = defaultOptions) {
    this.options = options;
    this.parseInitOptions();
  }

  // Main entry point to install a TypeScript package as an NPM postinstall script.
  main(): BluePromise<void> {
    dlog('main');

    return this.readConfigFile()
      .then(() => { return this.readPackageConfigFile(); })
      .then(() => { return this.wrapDeclaration(); })
      .then(() => { return this.copyExportedModules(); })
      .then(() => { return this.haulTypings(); });
  }

  // Parse the options at initialization.
  private parseInitOptions(): void {
    // Enable verbose output by recreating the dlog function.
    if (this.options.verbose) {
      debug.enable(debugNamespace);
      dlog = debug(debugNamespace);
      dlog('Verbose output');
    }

    // Show all command-line options.
    dlog('Options:\n' + JSON.stringify(this.options, null, 2));

    // Display whether dry run mode is enabled.
    if (this.options.dryRun) {
      dlog('Dry run');
    }
  }

  // Read the configuration file for this utility.
  private readConfigFile(): BluePromise<void> {
    var configFile = this.options.configFile;
    return fsAsync.existsAsync(configFile)
      .then((exists: boolean): BluePromise<string> => {
        if (exists) {
          dlog('Reading config file: ' + configFile);
          return fsAsync.readFileAsync(configFile, 'utf8');
        } else {
          dlog('Config file not found: ' + configFile);
          // Parse an empty JSON object to use the defaults.
          return BluePromise.resolve('{}');
        }
      })
      .then((contents: string): void => {
        this.config = <IConfig> JSON.parse(contents);
      });
  }

  // Read the package configuration.
  private readPackageConfigFile(): BluePromise<void> {
    // TODO
    this.packageConfig = {};
    return BluePromise.resolve();
  }

  // Wrap the exported declaration file based on the "main" file from package.json.
  private wrapDeclaration(): BluePromise<void> {
    assert(this.config);
    // TODO
    return BluePromise.resolve();
  }

  // Copy exported modules into typings
  private copyExportedModules(): BluePromise<void> {
    assert(this.config);
    // TODO
    return BluePromise.resolve();
  }

  // Incorporate typings from our own dependencies.
  private haulTypings(): BluePromise<void> {
    assert(this.config);
    // TODO
    return BluePromise.resolve();
  }
}

// Parse command line arguments.
commander.parse(process.argv);
dlog('commander:\n' + JSON.stringify(commander, null, 2));

if (commander.args.length !== 0) {
  process.stderr.write('Unexpected arguments.\n');
  commander.help();
} else {
  // Retrieve the options (which are stored as undeclared members of the command object).
  var options = new Options(commander);
  var mgr = new TypeScriptPackageInstaller(options);
  mgr.main()
    .catch((err: Error) => {
      dlog(err.toString());
      process.stderr.write(__filename + ': ' + err.toString() + '\n');
      process.exit(1);
    });
}
