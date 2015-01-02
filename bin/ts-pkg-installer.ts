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

// Point to the standard location for exported module declarations.
var exportDirGlob = path.join('lib', 'export', '*.d.ts');
// Point to the location where typings will be exported.
var typingsDir = path.join('..', '..', 'typings');

// ## Config
// Configuration data from tspi.json
class Config {

  // Path to the NPM package.json config file.
  packageConfig: string;

  // Path to the exported module declaration file.  By default, this is the *.d.ts with the same basename as the "main"
  // JS file, as declared in package config.
  mainDeclaration: string;

  constructor(config: any = {}) {
    this.packageConfig = config.packageConfig || 'package.json';
    this.mainDeclaration = config.mainDeclaration;
  }
}

var defaultConfig = new Config();

// ## PackageConfig
// Configuration data from package.json (the part we care about).
class PackageConfig {
  name: string;
  main: string;

  constructor(config: any = {}) {
    this.name = config.name;
    this.main = config.main || 'index.js';
  }
}

// ## fsExistsAsync
// Special handling for fs.exists, which does not conform to Node.js standards for async interfaces.

// We must first normalize the fs.exists API to give it the node-like callback signature.
function normalizedFsExists(file: string, callback: (error: Error, result: boolean) => void) {
  fs.exists(file, (exists: boolean): void => {
    callback(null, exists);
  });
}

// Next, we wrap the normalized API with Q to make it return a promise.
interface IFsExistsAsync {
  (file: string): BluePromise<boolean>;
}
var fsExistsAsync: IFsExistsAsync = <IFsExistsAsync> BluePromise.promisify(normalizedFsExists);

// ## fsReadFileAsync
// fs.readFile conforms to Node.js standards, so we only need to define the interface to make up for the deficiency in
// the bluebird TSD.
interface IFsReadFileAsync {
  (file: string, encoding: string): BluePromise<string>;
}
var fsReadFileAsync: IFsReadFileAsync = <IFsReadFileAsync> BluePromise.promisify(fs.readFile);

// ### DeclarationFileState
// Maintain a state machine, separating the file into header and body sections.
enum DeclarationFileState {Header, Body};

// ## TypeScriptPackageInstaller
// Used as the NPM postinstall script, this will do the following:
// - Read configuration from tspi.json (or options.configFile)
// - Wrap the main declaration file
// - Copy the main declaration file to the "typings" directory
class TypeScriptPackageInstaller {

  private options: Options;
  private config: Config;
  private packageConfig: PackageConfig;
  private wrappedMainDeclaration: string;

  constructor (options: Options = defaultOptions) {
    this.options = options;
    this.parseInitOptions();
  }

  // Main entry point to install a TypeScript package as an NPM postinstall script.
  main(): BluePromise<void> {
    dlog('main');

    return this.readConfigFile()
      .then(() => { return this.readPackageConfigFile(); })
      .then(() => { return this.wrapMainDeclaration(); })
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
    var readFromFile: boolean;
    return fsExistsAsync(configFile)
      .then((exists: boolean): BluePromise<string> => {
        if (exists) {
          dlog('Reading config file: ' + configFile);
          readFromFile = true;
          return fsReadFileAsync(configFile, 'utf8');
        } else {
          dlog('Config file not found: ' + configFile);

          // If they specified a config file, we will fail if it does not exist.
          if (configFile !== defaultOptions.configFile) {
            throw new Error('Config file does not exist: ' + configFile);
          }

          // Otherwise, just use the defaults (as if parsing an empty config file).
          readFromFile = false;
          // Parse an empty JSON object to use the defaults.
          return BluePromise.resolve('{}');
        }
      })
      .then((contents: string): void => {
        if (readFromFile) {
          dlog('Read config file: ' + configFile);
          dlog('Config file contents:\n' + contents);
        }
        this.config = new Config(JSON.parse(contents));
      });
  }

  // Read the package configuration.
  private readPackageConfigFile(): BluePromise<void> {
    assert(this.config && this.config.packageConfig);
    var packageConfigFile: string = this.config.packageConfig;
    dlog('Reading package config file: ' + packageConfigFile);
    return fsReadFileAsync(packageConfigFile, 'utf8')
      .then((contents: string): void => {
        dlog('Read package config file: ' + packageConfigFile);
        this.packageConfig = new PackageConfig(JSON.parse(contents));
      })
      .catch((error: any): void => {
        // Create a more user-friendly error message
        throw new Error('Package config file could not be read: ' + packageConfigFile);
      });
  }

  // Wrap the main declaration file, by default based on the "main" JS file from package.json.
  private wrapMainDeclaration(): BluePromise<void> {
    assert(this.config);

    // Figure out what the main declaration file is.
    var mainDeclarationFile = this.determineMainDeclaration();

    dlog('Reading main declaration file: ' + mainDeclarationFile);
    return fsReadFileAsync(mainDeclarationFile, 'utf8')
      .then((contents: string): BluePromise<string> => {
        dlog('Parsing main declaration file: ' + mainDeclarationFile);
        return this.wrapMainDeclarationContents(contents);
      })
      .then((wrapped: string): void => {
        dlog('Wrapped main declaration file:\n' + wrapped);
        this.wrappedMainDeclaration = wrapped;
      })
      .catch((error: any): void => {
        // Create a more user-friendly error message
        throw new Error('Main declaration file could not be wrapped: ' + error.toString());
      });
  }

  // Determine what the main declaration file for the package is.  If not configured, it is the *.d.ts with the same
  // basename as the package "main" JS file.
  private determineMainDeclaration(): string {
    assert(this.config);
    assert(this.packageConfig);
    if (this.config.mainDeclaration) {
      return this.config.mainDeclaration;
    } else {
      var mainJS = this.packageConfig.main;
      var mainDTS = mainJS.replace(/\.js$/, '.d.ts');
      return mainDTS;
    }
  }

  // Wrap the main declaration file whose contents are provided.
  private wrapMainDeclarationContents(contents: string): BluePromise<string> {
    // Process each line in the main declaration file.
    var lines: string[] = contents.split('\n');

    // Recognize reference path lines that form the header.
    var referencePathRegex = /^ *\/\/\/ *<reference *path *= *".*" *\/> *$/;

    // Maintain a state machine, separating the file into header and body sections.
    var state: DeclarationFileState = DeclarationFileState.Header;

    var reducer = (wrapped: string[], line: string): string[] => {

      // See if we have a reference path.
      var isReferencePath: boolean = line.match(referencePathRegex) && true;
      if (state === DeclarationFileState.Header) {
        if (!isReferencePath) {
          // Transitioning out of header state, so emit the module declaration.
          wrapped.push(this.moduleDeclaration());
          state = DeclarationFileState.Body;
        }
      }

      // Emit the line (but not blank lines).
      if (line !== '') {
        wrapped.push(line);
      }
      return wrapped;
    };

    return BluePromise.reduce(lines, reducer, [])
      .then((wrapped: string[]): string => {
        // End by closing the module declaration
        wrapped.push('}');
        wrapped.push('');

        return wrapped.join('\n');
      });
  }

  // Return the TypeScript module declaration statement for this package.
  private moduleDeclaration(): string {
    assert(this.packageConfig && this.packageConfig.name);
    return 'declare module \'' + this.packageConfig.name + '\' {';
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
