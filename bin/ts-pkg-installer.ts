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

var dlog: debug.Debugger = debug('ts-pkg-installer');

// Name of the configuration file for this program (default).
var configFileDefault = 'tspi.json';
// Name of the configuration file for the node package.
var packageConfigFile = 'package.json';
// Point to the standard location for exported module declarations.
var exportDirGlob = path.join('lib', 'export', '*.d.ts');
// Point to the location where typings will be exported.
var typingsDir = path.join('..', '..', 'typings');

// Command-line options, describing the structure of options in commander.
interface IOptions {
  configFile: string;
}

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

  private options: IOptions;
  private config: IConfig;
  private packageConfig: IPackageConfig;

  constructor (options: IOptions) {
    this.options = options;
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

  // Read the configuration file for this utility.
  private readConfigFile(): Q.Promise<void> {
    var configFile = this.options.configFile || configFileDefault;
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

if (commander.args.length !== 0) {
  process.stderr.write('Unexpected arguments.\n');
  commander.help();
} else {
  var mgr = new TypeScriptPackageInstaller(<IOptions> commander.opts());
  mgr.main()
    .catch((err: Error) => {
      dlog(err.toString());
      process.stderr.write(__filename + ': ' + err.toString() + '\n');
      process.exit(1);
    });
}
