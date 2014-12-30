// ts-pkg-installer.ts
///<reference path="../typings/commander/commander.d.ts"/>
///<reference path="../typings/debug/debug.d.ts"/>
///<reference path="../typings/glob/glob.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/q/Q.d.ts"/>

'use strict';

import assert = require('assert');
import commander = require('commander');
import debug = require('debug');
import glob = require('glob');
import path = require('path');
import Q = require('q');

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

// Define the CLI.
commander
  .option('-f, --config-file', 'Config file [' + defaultOptions.configFile + ']', defaultOptions.configFile)
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

// Configuration data from tspm.json
interface IConfig {
}

// Configuration data from package.json
interface IPackageConfig {
}

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
  main(): Q.Promise<void> {
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
  private readConfigFile(): Q.Promise<void> {
    var configFile = this.options.configFile;
    // TODO
    this.config = {};
    return Q(<void>null);
  }

  // Read the package configuration.
  private readPackageConfigFile(): Q.Promise<void> {
    // TODO
    this.packageConfig = {};
    return Q(<void>null);
  }

  // Wrap the exported declaration file based on the "main" file from package.json.
  private wrapDeclaration(): Q.Promise<void> {
    assert(this.config);
    // TODO
    return Q(<void>null);
  }

  // Copy exported modules into typings
  private copyExportedModules(): Q.Promise<void> {
    assert(this.config);
    // TODO
    return Q(<void>null);
  }

  // Incorporate typings from our own dependencies.
  private haulTypings(): Q.Promise<void> {
    assert(this.config);
    // TODO
    return Q(<void>null);
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
