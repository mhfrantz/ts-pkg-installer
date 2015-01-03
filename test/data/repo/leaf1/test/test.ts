/// <reference path="../lib/index.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

import chai = require('chai');
import leaf1 = require('../lib/index');
import os = require('os');

describe ('leaf1', () => {
  var expect = chai.expect;

  it ('compiles', () => {
    // BLANK
  });

  it ('returns something', () => {
    expect(leaf1()).to.be.ok;
  });

  it ('returns platform', () => {
    expect(leaf1()).to.equal(os.platform());
  });
});
