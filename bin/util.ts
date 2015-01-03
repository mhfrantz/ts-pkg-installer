// util.ts
///<reference path="../typings/lodash/lodash.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>

'use strict';

// Unit testing interface for ts-pkg-installer.ts

import _ = require('lodash');
import path = require('path');

// ## TsdPackage
// Configuration for a single TSD package (the part we care about).
export class TsdPackage {
  commit: string;

  constructor(commit: string) {
    this.commit = commit;
  }
}

// ## ITsdPackageMap
// Configuration for a set of TSD packages (the part we care about).
export interface ITsdPackageMap {
  [dtsFile: string]: TsdPackage
}

// ## TsdConfig
// Configuration data from tsd.json (the part we care about).
export class TsdConfig {
  version: string;
  repo: string;
  ref: string;
  path: string;
  bundle: string;
  installed: ITsdPackageMap;

  constructor(config: any = {}) {
    this.version = config.version || 'v4';
    this.repo = config.repo || 'borisyankov/DefinitelyTyped';
    this.ref = config.ref || 'master';
    this.path = config.path || 'typings';
    this.bundle = config.bundle || path.join(this.path, 'tsd.d.ts');
    this.installed = <ITsdPackageMap> config.installed || {};
  }

  // Incorporate any installed packages from another config.
  incorporate(that: TsdConfig): void {
    _.forEach(that.installed, this.addPackage.bind(this));
  }

  // Add a package to the set of installed packages.
  addPackage(pkg: TsdPackage, dtsFile: string): void {
    if (! (dtsFile in this.installed)) {
      this.installed[dtsFile] = pkg;
    }
  }
}
