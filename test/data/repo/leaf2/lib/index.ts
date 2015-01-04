/// <reference path="../typings/node/node.d.ts"/>

import os = require('os');

function leaf2(): string {
  return os.arch();
}

export = leaf2;
