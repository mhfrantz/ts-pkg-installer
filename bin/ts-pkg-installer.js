// ts-pkg-installer.ts
///<reference path="../typings/commander/commander.d.ts"/>
///<reference path="../typings/debug/debug.d.ts"/>
///<reference path="../typings/node/node.d.ts"/>
'use strict';
var commander = require('commander');
var debug = require('debug');
var dlog = debug('ts-pkg-installer');
function main() {
    dlog('main');
    // TODO
}
// Parse command line arguments.
commander.parse(process.argv);
if (commander.args.length !== 0) {
    process.stderr.write('Unexpected arguments.\n');
    commander.help();
}
else {
    main();
}
//# sourceMappingURL=ts-pkg-installer.js.map