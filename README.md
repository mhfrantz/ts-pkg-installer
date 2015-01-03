ts-pkg-installer
================

# TypeScript package installer (TSPI)

This module contains a command-line executable (ts-pkg-installer) that is designed to be used as an NPM "postinstall"
hook for any NPM module that has a TypeScript (TS) interface.

## Why do I need this tool?

If you build TS NPM modules for Node.js, and you want to reuse those TS modules to create more modules, then you may
need this tool.

If you use the TSD tool (TypeScript DefinitelyTyped), then you may need this tool.

If you have ever tried to reuse a TS module and had problems (namely, duplicate declarations) because some TSD
declaration files are referenced multiple times in a set of modules, then you probably need this tool.

## How does it work?

The tool performs two related tasks:

1. It exports your module declaration file to a depending package's "typings" directory, normalizing reference paths as
necessary.

2. It aggregates the TSD dependencies into a single TSD configuration file (node_modules/tsd.json), so that the
depending package can install a single copy of each TSD declaration file.

## How do I use it?

You simply need to "npm install" this package, and then set "ts-pkg-installer" as your "postinstall" script.  When
anyone installs your package, the script will do its thing.

## Isn't that too good to be true?

Probably.  There may be scenarios that were not anticipated in the design and implementation of this tool.  Let me know
if it doesn't work for you.

## Are all those tests necessary?

I think so.  There are Mocha unit tests that focus on particular small features, and Cucumber tests that perform
integration tests in the NPM installation context.
