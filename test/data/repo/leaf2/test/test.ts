/// <reference path="../lib/index.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

import chai = require('chai');
import leaf2 = require('../lib/index');
import os = require('os');

describe ('leaf2', () => {
  var expect = chai.expect;

  it ('compiles', () => {
    // BLANK
  });

  it ('returns something', () => {
    expect(leaf2()).to.be.ok;
  });

  it ('returns arch', () => {
    expect(leaf2()).to.equal(os.arch());
  });
});
