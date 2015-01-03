/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/node/node.d.ts" />
export declare class TsdPackage {
    commit: string;
    constructor(commit: string);
}
export interface ITsdPackageMap {
    [dtsFile: string]: TsdPackage;
}
export declare class TsdConfig {
    version: string;
    repo: string;
    ref: string;
    path: string;
    bundle: string;
    installed: ITsdPackageMap;
    constructor(config?: any);
    incorporate(that: TsdConfig): void;
    addPackage(pkg: TsdPackage, dtsFile: string): void;
}
