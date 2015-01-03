/// <reference path="../typings/node/node.d.ts"/>

import os = require('os');

function leaf1(): string {
  return os.platform();
}

export = leaf1;
