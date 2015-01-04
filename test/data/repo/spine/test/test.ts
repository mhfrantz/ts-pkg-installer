/// <reference path="../lib/index.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../typings/chai/chai.d.ts"/>

import chai = require('chai');
import spine = require('../lib/index');

describe ('spine', () => {
  var expect = chai.expect;

  it ('returns something', () => {
    expect(spine()).to.be.ok;
  });
});
