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


var invalid = [
  { json: '{', err: 'Unexpected end of input' },
  { json: '}', err: 'Ln 1, Col 0 : Unexpected token } near the <}>' },
  { json: '[', err: 'Unexpected end of input' },
  { json: '',  err: 'Unexpected end of input' },
  { json: '{a:1}',   err: 'Ln 1, Col 1 : Unexpected token a near the <a>, expected: String' },
  { json: '{"a":a}', err: 'Ln 1, Col 5 : Unexpected token a near the <a>' },
  { json: '{"a":undefined}', err: 'Ln 1, Col 5 : Unexpected token u near the <undefined>' }
];

// ECMA262 does not define the standard of error messages.
// However, we throw error messages the same as JSON.parse()
describe("error messages", function(){
  invalid.forEach(function (i) {
    it('error message: ' + i.err, function(){
      var error;
      var err;

      try {
        parser.parse(i.json);
      } catch(e) {
        error = e;
      }

      expect(!!(i.err && error)).to.equal(true);
      expect(error.message).to.equal(i.err);
    });
  });
});
