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
var fs = require('fs');
var path = require('path');
BluePromise.longStackTraces();
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
// ## CLI
// Define the CLI.
commander.option('-f, --config-file <path>', 'Config file [' + defaultOptions.configFile + ']', defaultOptions.configFile).option('-n, --dry-run', 'Dry run (display what would happen without taking action)').option('-v, --verbose', 'Verbose logging').version('1.0.0');
var debugNamespace = 'ts-pkg-installer';
var dlog = debug(debugNamespace);
// Point to the standard location for exported module declarations.
var exportDirGlob = path.join('lib', 'export', '*.d.ts');
// Point to the location where typings will be exported.
var typingsDir = path.join('..', '..', 'typings');
// ## Config
// Configuration data from tspi.json
var Config = (function () {
    function Config(config) {
        if (config === void 0) { config = {}; }
        this.packageConfig = config.packageConfig || 'package.json';
        this.mainDeclaration = config.mainDeclaration;
    }
    return Config;
})();
var defaultConfig = new Config();
// ## PackageConfig
// Configuration data from package.json (the part we care about).
var PackageConfig = (function () {
    function PackageConfig(config) {
        if (config === void 0) { config = {}; }
        this.name = config.name;
        this.main = config.main || 'index.js';
    }
    return PackageConfig;
})();
// ## fsExistsAsync
// Special handling for fs.exists, which does not conform to Node.js standards for async interfaces.
// We must first normalize the fs.exists API to give it the node-like callback signature.
function normalizedFsExists(file, callback) {
    fs.exists(file, function (exists) {
        callback(null, exists);
    });
}
var fsExistsAsync = BluePromise.promisify(normalizedFsExists);
var fsReadFileAsync = BluePromise.promisify(fs.readFile);
// ### DeclarationFileState
// Maintain a state machine, separating the file into header and body sections.
var DeclarationFileState;
(function (DeclarationFileState) {
    DeclarationFileState[DeclarationFileState["Header"] = 0] = "Header";
    DeclarationFileState[DeclarationFileState["Body"] = 1] = "Body";
})(DeclarationFileState || (DeclarationFileState = {}));
;
// ## TypeScriptPackageInstaller
// Used as the NPM postinstall script, this will do the following:
// - Read configuration from tspi.json (or options.configFile)
// - Wrap the main declaration file
// - Copy the main declaration file to the "typings" directory
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
            return _this.wrapMainDeclaration();
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
        var _this = this;
        var configFile = this.options.configFile;
        var readFromFile;
        return fsExistsAsync(configFile).then(function (exists) {
            if (exists) {
                dlog('Reading config file: ' + configFile);
                readFromFile = true;
                return fsReadFileAsync(configFile, 'utf8');
            }
            else {
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
        }).then(function (contents) {
            if (readFromFile) {
                dlog('Read config file: ' + configFile);
                dlog('Config file contents:\n' + contents);
            }
            _this.config = new Config(JSON.parse(contents));
        });
    };
    // Read the package configuration.
    TypeScriptPackageInstaller.prototype.readPackageConfigFile = function () {
        var _this = this;
        assert(this.config && this.config.packageConfig);
        var packageConfigFile = this.config.packageConfig;
        dlog('Reading package config file: ' + packageConfigFile);
        return fsReadFileAsync(packageConfigFile, 'utf8').then(function (contents) {
            dlog('Read package config file: ' + packageConfigFile);
            _this.packageConfig = new PackageConfig(JSON.parse(contents));
        }).catch(function (error) {
            throw new Error('Package config file could not be read: ' + packageConfigFile);
        });
    };
    // Wrap the main declaration file, by default based on the "main" JS file from package.json.
    TypeScriptPackageInstaller.prototype.wrapMainDeclaration = function () {
        var _this = this;
        assert(this.config);
        // Figure out what the main declaration file is.
        var mainDeclarationFile = this.determineMainDeclaration();
        dlog('Reading main declaration file: ' + mainDeclarationFile);
        return fsReadFileAsync(mainDeclarationFile, 'utf8').then(function (contents) {
            dlog('Parsing main declaration file: ' + mainDeclarationFile);
            return _this.wrapMainDeclarationContents(contents);
        }).then(function (wrapped) {
            dlog('Wrapped main declaration file:\n' + wrapped);
            _this.wrappedMainDeclaration = wrapped;
        }).catch(function (error) {
            throw new Error('Main declaration file could not be wrapped: ' + error.toString());
        });
    };
    // Determine what the main declaration file for the package is.  If not configured, it is the *.d.ts with the same
    // basename as the package "main" JS file.
    TypeScriptPackageInstaller.prototype.determineMainDeclaration = function () {
        assert(this.config);
        assert(this.packageConfig);
        if (this.config.mainDeclaration) {
            return this.config.mainDeclaration;
        }
        else {
            var mainJS = this.packageConfig.main;
            var mainDTS = mainJS.replace(/\.js$/, '.d.ts');
            return mainDTS;
        }
    };
    // Wrap the main declaration file whose contents are provided.
    TypeScriptPackageInstaller.prototype.wrapMainDeclarationContents = function (contents) {
        var _this = this;
        // Process each line in the main declaration file.
        var lines = contents.split('\n');
        // Recognize reference path lines that form the header.
        var referencePathRegex = /^ *\/\/\/ *<reference *path *= *".*" *\/> *$/;
        // Maintain a state machine, separating the file into header and body sections.
        var state = 0 /* Header */;
        var reducer = function (wrapped, line) {
            // See if we have a reference path.
            var isReferencePath = line.match(referencePathRegex) && true;
            if (state === 0 /* Header */) {
                if (!isReferencePath) {
                    // Transitioning out of header state, so emit the module declaration.
                    wrapped.push(_this.moduleDeclaration());
                    state = 1 /* Body */;
                }
            }
            // Emit the line (but not blank lines).
            if (line !== '') {
                wrapped.push(line);
            }
            return wrapped;
        };
        return BluePromise.reduce(lines, reducer, []).then(function (wrapped) {
            // End by closing the module declaration
            wrapped.push('}');
            wrapped.push('');
            return wrapped.join('\n');
        });
    };
    // Return the TypeScript module declaration statement for this package.
    TypeScriptPackageInstaller.prototype.moduleDeclaration = function () {
        assert(this.packageConfig && this.packageConfig.name);
        return 'declare module \'' + this.packageConfig.name + '\' {';
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