'use strict';

var expect = require('chai').expect;
var parser = require('../');

// var a = parser.parse('//top\n{// top a\n/* abc */"a":1,//right\n/* bcd */"b":{"a":1}}//bottom');
// // var a = parser.parse('{/*top*/"a":1,//right\n/*abc*/"b":{"a":1}}');
// console.log(a);

var cases = [
  {
    d: 'comment at the top',
    s: '//top\n{"a":1}',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect(obj['//^']).to.deep.equal(['//top']);
    }
  },
  {
    d: 'multiple comments at the top, both line and block',
    s: '//top\n/*abc*/{"a":1}',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect(obj['//^']).to.deep.equal(['//top', '/*abc*/']);
    }
  },
  {
    d: 'comment at the bottom',
    s: '{"a":1}\n//bot',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect(obj['//$']).to.deep.equal(['//bot']);
    }
  },
  {
    d: 'multiple comments at the bottom, both line and block',
    s: '{"a":1}\n//top\n/*abc*/',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect(obj['//$']).to.deep.equal(['//top', '/*abc*/']);
    }
  },
  {
    d: 'comment for properties',
    s: '{//a\n"a":1}',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect('// a' in obj).to.equal(true);
      expect(obj['// a']).to.deep.equal([['//a']]);
    }
  },
  {
    d: 'comment for properties, multiple at the top',
    s: '{//a\n/*b*/"a":1}',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect('// a' in obj).to.equal(true);
      expect(obj['// a']).to.deep.equal([['//a', '/*b*/']]);
    }
  },
  {
    d: 'comment for properties, both top and right',
    s: '{//a\n"a":1//b\n}',
    e: function (obj) {
      expect(obj.a).to.equal(1);
      expect('// a' in obj).to.equal(true);
      expect(obj['// a']).to.deep.equal([['//a'], ['//b']]);
    }
  }
]

describe("parse()", function(){
  cases.forEach(function (c) {
    it(c.d, function(){
      c.e(parser.parse(c.s));
    });
  });
});