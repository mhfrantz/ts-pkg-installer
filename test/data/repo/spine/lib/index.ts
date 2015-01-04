/// <reference path="../typings/leaf1/index.d.ts"/>
/// <reference path="../typings/leaf2/index.d.ts"/>

import leaf1 = require('leaf1');
import leaf2 = require('leaf2');

function spine(): string {
  return leaf1() + '/' + leaf2();
}

export = spine;
