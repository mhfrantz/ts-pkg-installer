// ts-pkg-installer.ts
///<reference path="../typings/commander/commander.d.ts"/>
///<reference path="../typings/bluebird/bluebird.d.ts"/>
///<reference path="../typings/debug/debug.d.ts"/>
///<reference path="../typings/glob/glob.d.ts"/>
///<reference path="../typings/mkdirp/mkdirp.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>

///<reference path="./util.ts"/>

'use strict';

import assert = require('assert');
import BluePromise = require('bluebird');
import commander = require('commander');
import debug = require('debug');
import fs = require('fs');
import glob = require('glob');
import mkdirp = require('mkdirp');
import path = require('path');

import util = require('./util');

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

// ## Config
// Configuration data from tspi.json
class Config {

  // Force script to run even if it does not think it should run.
  force: boolean;

  // Path to the NPM package.json config file.
  packageConfig: string;

  // Path to the exported module declaration file.  By default, this is the *.d.ts with the same basename as the "main"
  // JS file, as declared in package config.
  mainDeclaration: string;

  // Typings directory in which our own TSD writes.  Default to 'typings'.
  localTypingsDir: string;

  // Typings directory into which the module declaration file and any dependencies will be written.  By default, this
  // will be ../../typings.
  exportedTypingsDir: string;

  // Subdirectory of typings directory in which our module declaration file is written.  By default, this is the
  // package name.
  typingsSubdir: string;

  // TSD configuration file in the current package.  Defaults to 'tsd.json'.
  localTsdConfig: string;

  // TSD configuration file to export.  Defaults to '../tsd.json', which should land in the node_module directory of
  // the depending package.
  exportedTsdConfig: string;

  constructor(config: any = {}) {
    this.force = config.force || false;
    this.packageConfig = config.packageConfig || 'package.json';
    this.mainDeclaration = config.mainDeclaration;
    this.localTypingsDir = config.localTypingsDir || 'typings';
    this.exportedTypingsDir = config.exportedTypingsDir || path.join('..', '..', 'typings');
    this.typingsSubdir = config.typingsSubdir;
    this.localTsdConfig = config.localTsdConfig || 'tsd.json';
    this.exportedTsdConfig = config.exportedTsdConfig || path.join('..', 'tsd.json');
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

// Next, we wrap the normalized API with bluebird to make it return a promise.
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

// ## fsWriteFileAsync
// fs.writeFile conforms to Node.js standards, so we only need to define the interface to make up for the deficiency in
// the bluebird TSD.
interface IFsWriteFileAsync {
  (file: string, contents: string): BluePromise<void>;
}
var fsWriteFileAsync: IFsWriteFileAsync = <IFsWriteFileAsync> BluePromise.promisify(fs.writeFile);

// ## mkdirp
interface IMkDirP {
  (path: string): BluePromise<void>;
}
var mkdirpAsync: IMkDirP = <IMkDirP> BluePromise.promisify(mkdirp);

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
  private localTsdConfig: util.TsdConfig;
  private exportedTsdConfig: util.TsdConfig;

  // Directory containing the wrapped main declaration file that we export.
  private exportedTypingsSubdir: string;

  constructor (options: Options = defaultOptions) {
    this.options = options;
    this.parseInitOptions();
  }

  // Main entry point to install a TypeScript package as an NPM postinstall script.
  main(): BluePromise<void> {
    dlog('main');

    return this.readConfigFile()
      .then(() => {
        if (this.shouldRun()) {
          return this.readPackageConfigFile()
            .then(() => { return this.determineExportedTypingsSubdir(); })
            .then(() => { return this.wrapMainDeclaration(); })
            .then(() => { return this.copyExportedModules(); })
            .then(() => { return this.readLocalTsdConfigFile(); })
            .then(() => { return this.maybeHaulTypings(); });
        } else {
          return BluePromise.resolve();
        }
      });
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

  // Determine if we should run based on whether it looks like we're inside a node_modules directory.  This
  // distinguishes between being called in two NPM postinstall cases:
  // - after our package is installed inside a depending package
  // - after our own dependencies are installed
  private shouldRun(): boolean {
    var parentDir: string = path.basename(path.dirname(process.cwd()));
    var should: boolean = this.config.force || parentDir === 'node_modules';
    if (this.config.force) {
      dlog('Forced to run');
    }
    if (!should) {
      dlog('Should not run');
    }
    return should;
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

  // Determine where we will write our main declaration file.
  // - Side effect: Sets `this.config.typingsSubdir`, if not specified in config file
  // - Side effect: Sets `this.exportedTypingsSubdir`.
  private determineExportedTypingsSubdir(): void {
    // Use the package name if no typings subdir specified.
    if (!this.config.typingsSubdir) {
      this.config.typingsSubdir = this.packageConfig.name;
    }

    this.exportedTypingsSubdir = path.join(this.config.exportedTypingsDir, this.config.typingsSubdir);
  }

  // Wrap the main declaration file, by default based on the "main" JS file from package.json.
  private wrapMainDeclaration(): BluePromise<void> {
    assert(this.config);
    assert(this.config.typingsSubdir);

    // Figure out what the main declaration file is.
    var mainDeclarationFile: string = this.determineMainDeclaration();

    // Determine the directory containing the file, so that we will be able to resolve relative reference paths.
    var mainDeclarationDir: string = path.dirname(path.resolve(mainDeclarationFile));

    dlog('Reading main declaration file: ' + mainDeclarationFile);
    return fsReadFileAsync(mainDeclarationFile, 'utf8')
      .then((contents: string): BluePromise<string> => {
        dlog('Parsing main declaration file: ' + mainDeclarationFile);
        return this.wrapMainDeclarationContents(contents, mainDeclarationDir);
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
  // - *contents*: Contents of the main declaration file (TypeScript *.d.ts file)
  // - *referencePathDir*: Directory to resolve related reference paths.
  private wrapMainDeclarationContents(contents: string, referencePathDir: string): BluePromise<string> {
    // Process each line in the main declaration file.
    var lines: string[] = contents.split('\n');

    // Recognize reference path lines that form the header.
    var referencePathRegex = /^ *\/\/\/ *<reference *path *= *"(.*)" *\/> *$/;

    // Recognize declarations in the body.
    var declarationRegex = /^(export )?(declare )(.*)$/;

    // Maintain a state machine, separating the file into header and body sections.
    var state: DeclarationFileState = DeclarationFileState.Header;

    var reducer = (wrapped: string[], line: string): string[] => {

      if (state === DeclarationFileState.Header) {
        // See if we have a reference path.
        var referencePathMatches: string[] = line.match(referencePathRegex);
        var isReferencePath: boolean = referencePathMatches && true;
        if (isReferencePath) {

          // Rewrite the reference path relative to the destination typings directory.
          var referencePath: string = referencePathMatches[1];
          assert(referencePath);
          line = this.rewriteReferencePath(referencePath, referencePathDir);

        } else {

          // Transitioning out of header state, so emit the module declaration.
          wrapped.push(this.moduleDeclaration());
          state = DeclarationFileState.Body;
        }
      }

      if (state === DeclarationFileState.Body) {
        // See if we have a declaration of some sort.
        var declarationMatches: string[] = line.match(declarationRegex);
        var isDeclaration: boolean = declarationMatches && true;
        if (isDeclaration) {
          // Remove the 'declare' keyword, as it is not allowed within a module declaration.
          line = (declarationMatches[1] || '') + declarationMatches[3];
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

  // Rewrite the reference path relative to the destination typings directory.
  // - *referencePath*: TypeScript reference path
  // - *dir*: Directory for resolving relative path
  private rewriteReferencePath(referencePath: string, dir: string): string {
    assert(this.config && this.config.typingsSubdir);
    assert(this.config && this.config.localTypingsDir);

    var localTypingsSubdir: string = path.resolve(path.join(this.config.localTypingsDir, this.config.typingsSubdir));
    var currentPath: string = path.resolve(dir, referencePath);
    var newPath: string = path.relative(localTypingsSubdir, currentPath);
    return '/// <reference path="' + newPath + '" />';
  }

  // Return the TypeScript module declaration statement for this package.
  private moduleDeclaration(): string {
    assert(this.packageConfig && this.packageConfig.name);
    return 'declare module \'' + this.packageConfig.name + '\' {';
  }

  // Copy exported modules into typings
  private copyExportedModules(): BluePromise<void> {
    assert(this.config);
    assert(this.exportedTypingsSubdir);
    assert(this.wrappedMainDeclaration);

    // Create the directory.
    dlog('Creating directory for main declaration file: ' + this.exportedTypingsSubdir);
    return this.maybeDo((): BluePromise<void> => { return mkdirpAsync(this.exportedTypingsSubdir); })
      .then((): BluePromise<void> => {
        // Use the same basename.
        var basename: string = path.basename(this.determineMainDeclaration());
        var mainDeclaration: string = path.join(this.exportedTypingsSubdir, basename);
        dlog('Writing main declaration file: ' + mainDeclaration);
        return this.maybeDo((): BluePromise<void> => {
          return fsWriteFileAsync(mainDeclaration, this.wrappedMainDeclaration);
        });
      });
  }

  // Read the local TSD configuration.
  private readLocalTsdConfigFile(): BluePromise<void> {
    assert(this.config && this.config.localTsdConfig);
    return this.readTsdConfigFile(this.config.localTsdConfig)
      .then((config: util.TsdConfig): void => {
        this.localTsdConfig = config;
      });
  }

  // Read the exported TSD configuration (if any).
  private readExportedTsdConfigFile(): BluePromise<void> {
    assert(this.config && this.config.exportedTsdConfig);
    return this.readTsdConfigFile(this.config.exportedTsdConfig)
      .then((config: util.TsdConfig): void => {
        this.exportedTsdConfig = config;
      });
  }

  // Read the specified TSD configuration.  Return null if file does not exist.
  private readTsdConfigFile(path: string): BluePromise<util.TsdConfig> {
    dlog('Reading TSD config file: ' + path);
    return fsReadFileAsync(path, 'utf8')
      .then((contents: string): util.TsdConfig => {
        dlog('Read TSD config file: ' + path);
        return new util.TsdConfig(JSON.parse(contents));
      })
      .catch((error: any): util.TsdConfig => {
        // It's OK if the file isn't there.
        dlog('Ignoring error reading TSD config file: ' + path + ': ' + error.toString());
        return <util.TsdConfig> null;
      });
  }

  // Incorporate typings from our own dependencies (if any).
  private maybeHaulTypings(): BluePromise<void> {
    // If we have no typings, we don't have anything to do.
    if (!this.localTsdConfig) {
      dlog('No TSD typings to haul');
      return BluePromise.resolve();
    } else {
      return this.readExportedTsdConfigFile()
        .then((): void => {
          this.haulTypings();
        });
    }
  }

  // Incorporate typings from our own dependencies.
  private haulTypings(): BluePromise<void> {
    assert(this.localTsdConfig);
    // If we have no existing exported typings, we can trivially export ours.
    if (!this.exportedTsdConfig) {
      dlog('No existing exported TSD typings');
      this.exportedTsdConfig = this.localTsdConfig;

      // We do have to change the path to point to the place where we are exporting the typings.
      var tsdConfigDir: string = path.dirname(this.config.exportedTsdConfig);
      var typingsPath: string = path.relative(tsdConfigDir, this.config.exportedTypingsDir);
      dlog('Configured TSD typings path: ' + typingsPath);
      this.exportedTsdConfig.path = typingsPath;

    } else {

      dlog('Combining with existing exported TSD typings');
      this.exportedTsdConfig.incorporate(this.localTsdConfig);
    }

    // Write the resulting file.
    var contents: string = JSON.stringify(this.exportedTsdConfig, null, 2) + '\n';
    dlog('Combined TSD typings:\n' + contents);
    return this.maybeDo((): BluePromise<void> => {
      return fsWriteFileAsync(this.config.exportedTsdConfig, contents);
    });
  }

  // Allow conditional execution based on dry run mode.
  private maybeDo(action: () => BluePromise<void>): BluePromise<void> {
    if (!this.options.dryRun) {
      return action();
    } else {
      return BluePromise.resolve();
    }
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
