// util.ts
///<reference path="../typings/lodash/lodash.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>
'use strict';
// Unit testing interface for ts-pkg-installer.ts
var _ = require('lodash');
var path = require('path');
// ## TsdPackage
// Configuration for a single TSD package (the part we care about).
var TsdPackage = (function () {
    function TsdPackage(commit) {
        this.commit = commit;
    }
    return TsdPackage;
})();
exports.TsdPackage = TsdPackage;
// ## TsdConfig
// Configuration data from tsd.json (the part we care about).
var TsdConfig = (function () {
    function TsdConfig(config) {
        if (config === void 0) { config = {}; }
        this.version = config.version || 'v4';
        this.repo = config.repo || 'borisyankov/DefinitelyTyped';
        this.ref = config.ref || 'master';
        this.path = config.path || 'typings';
        this.bundle = config.bundle || path.join(this.path, 'tsd.d.ts');
        this.installed = config.installed || {};
    }
    // Incorporate any installed packages from another config.
    TsdConfig.prototype.incorporate = function (that) {
        _.forEach(that.installed, this.addPackage.bind(this));
    };
    // Add a package to the set of installed packages.
    TsdConfig.prototype.addPackage = function (pkg, dtsFile) {
        if (!(dtsFile in this.installed)) {
            this.installed[dtsFile] = pkg;
        }
    };
    return TsdConfig;
})();
exports.TsdConfig = TsdConfig;
//# sourceMappingURL=util.js.map