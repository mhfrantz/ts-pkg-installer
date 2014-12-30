// ts-pkg-installer.ts
///<reference path="../typings/commander/commander.d.ts"/>
///<reference path="../typings/debug/debug.d.ts"/>
///<reference path="../typings/glob/glob.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/q/Q.d.ts"/>
'use strict';
var assert = require('assert');
var commander = require('commander');
var debug = require('debug');
var path = require('path');
var Q = require('q');
var dlog = debug('ts-pkg-installer');
// Name of the configuration file for this program (default).
var configFileDefault = 'tspi.json';
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
        this.options = options;
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
    // Read the configuration file for this utility.
    TypeScriptPackageInstaller.prototype.readConfigFile = function () {
        var configFile = this.options.configFile || configFileDefault;
        // TODO
        this.config = {};
        return Q(null);
    };
    // Read the package configuration.
    TypeScriptPackageInstaller.prototype.readPackageConfigFile = function () {
        // TODO
        this.packageConfig = {};
        return Q(null);
    };
    // Wrap the exported declaration file based on the "main" file from package.json.
    TypeScriptPackageInstaller.prototype.wrapDeclaration = function () {
        assert(this.config);
        // TODO
        return Q(null);
    };
    // Copy exported modules into typings
    TypeScriptPackageInstaller.prototype.copyExportedModules = function () {
        assert(this.config);
        // TODO
        return Q(null);
    };
    // Incorporate typings from our own dependencies.
    TypeScriptPackageInstaller.prototype.haulTypings = function () {
        assert(this.config);
        // TODO
        return Q(null);
    };
    return TypeScriptPackageInstaller;
})();
// Parse command line arguments.
commander.parse(process.argv);
if (commander.args.length !== 0) {
    process.stderr.write('Unexpected arguments.\n');
    commander.help();
}
else {
    var mgr = new TypeScriptPackageInstaller(commander.opts());
    mgr.main().catch(function (err) {
        dlog(err.toString());
        process.stderr.write(__filename + ': ' + err.toString() + '\n');
        process.exit(1);
    });
}
//# sourceMappingURL=ts-pkg-installer.js.map