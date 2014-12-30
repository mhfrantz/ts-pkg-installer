// ts-pkg-installer.ts
///<reference path="../typings/commander/commander.d.ts"/>
///<reference path="../typings/bluebird/bluebird.d.ts"/>
///<reference path="../typings/debug/debug.d.ts"/>
///<reference path="../typings/glob/glob.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>
'use strict';
var assert = require('assert');
var BluePromise = require('bluebird');
var commander = require('commander');
var debug = require('debug');
var path = require('path');
// Command-line options, describing the structure of options in commander.
var Options = (function () {
    function Options(options) {
        if (options === void 0) { options = {}; }
        this.configFile = options.configFile || 'tspi.json';
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
    }
    return Options;
})();
var defaultOptions = new Options();
// Define the CLI.
commander.option('-f, --config-file', 'Config file [' + defaultOptions.configFile + ']', defaultOptions.configFile).option('-n, --dry-run', 'Dry run (display what would happen without taking action)').option('-v, --verbose', 'Verbose logging').version('1.0.0');
var debugNamespace = 'ts-pkg-installer';
var dlog = debug(debugNamespace);
// Name of the configuration file for the node package.
var packageConfigFile = 'package.json';
// Point to the standard location for exported module declarations.
var exportDirGlob = path.join('lib', 'export', '*.d.ts');
// Point to the location where typings will be exported.
var typingsDir = path.join('..', '..', 'typings');
// ## TypeScriptPackageInstaller
// Used as the NPM postinstall script, this will do the following:
// - Read configuration from tspi.json (or options.configFile)
// - Wrap the exported declaration file(s)
// - Copy the exported declaration file(s) to the "typings" directory
var TypeScriptPackageInstaller = (function () {
    function TypeScriptPackageInstaller(options) {
        if (options === void 0) { options = defaultOptions; }
        this.options = options;
        this.parseInitOptions();
    }
    // Main entry point to install a TypeScript package as an NPM postinstall script.
    TypeScriptPackageInstaller.prototype.main = function () {
        var _this = this;
        dlog('main');
        return this.readConfigFile().then(function () {
            return _this.readPackageConfigFile();
        }).then(function () {
            return _this.wrapDeclaration();
        }).then(function () {
            return _this.copyExportedModules();
        }).then(function () {
            return _this.haulTypings();
        });
    };
    // Parse the options at initialization.
    TypeScriptPackageInstaller.prototype.parseInitOptions = function () {
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
    };
    // Read the configuration file for this utility.
    TypeScriptPackageInstaller.prototype.readConfigFile = function () {
        var configFile = this.options.configFile;
        // TODO
        this.config = {};
        return BluePromise.resolve();
    };
    // Read the package configuration.
    TypeScriptPackageInstaller.prototype.readPackageConfigFile = function () {
        // TODO
        this.packageConfig = {};
        return BluePromise.resolve();
    };
    // Wrap the exported declaration file based on the "main" file from package.json.
    TypeScriptPackageInstaller.prototype.wrapDeclaration = function () {
        assert(this.config);
        // TODO
        return BluePromise.resolve();
    };
    // Copy exported modules into typings
    TypeScriptPackageInstaller.prototype.copyExportedModules = function () {
        assert(this.config);
        // TODO
        return BluePromise.resolve();
    };
    // Incorporate typings from our own dependencies.
    TypeScriptPackageInstaller.prototype.haulTypings = function () {
        assert(this.config);
        // TODO
        return BluePromise.resolve();
    };
    return TypeScriptPackageInstaller;
})();
// Parse command line arguments.
commander.parse(process.argv);
dlog('commander:\n' + JSON.stringify(commander, null, 2));
if (commander.args.length !== 0) {
    process.stderr.write('Unexpected arguments.\n');
    commander.help();
}
else {
    // Retrieve the options (which are stored as undeclared members of the command object).
    var options = new Options(commander);
    var mgr = new TypeScriptPackageInstaller(options);
    mgr.main().catch(function (err) {
        dlog(err.toString());
        process.stderr.write(__filename + ': ' + err.toString() + '\n');
        process.exit(1);
    });
}
//# sourceMappingURL=ts-pkg-installer.js.map