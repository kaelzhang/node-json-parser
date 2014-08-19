'use strict';

var tokenize = require('esprima').tokenize;

exports.tokenize = tokenize;
exports.parse = parse;

var tokens;
var current;
var index;

function parse (code, options) {
  tokens = tokenize(code, {
    comment: true,
    loc: true
  });

  if (!tokens.length) {
    unexpected_end();
  }

  sort_comment_tokens();

  index = -1;
  next();

  // var top_comment;
  // var bottom_comment;
  // if (is('comment')) {
  //   top_comment = current;
  // }

  var result = walk();
  return result;
}


function walk () {
  switch (type()) {
    case '{':
      next();
      return parse_object();
    case '[':
      next();
      return parse_array();
    case 'String':
    case 'Boolean':
    case 'Null':
    case 'Numeric':
      var value = current.value;
      next();
      return JSON.parse(value);
  }

  unexpected();
}


function next () {
  return current = tokens[++ index];
}


function expect (a) {
  if (!is(a)) {
    unexpected();
  }
}


function unexpected () {
  throw new SyntaxError('Unexpected token ' + current.value.slice(0, 1));
}

function unexpected_end () {
  throw new SyntaxError('Unexpected end of input');
}


function parse_object () {
  var obj = {};
  var comment;
  var started;
  var name;
  while (!is('}')){
    if (started) {
      expect(',');
      next();
    }
    started = true;
    expect('String');
    name = JSON.parse(current.value);
    if (current.comments) {
      obj['// ' + name] = current.comments;
    }
    next();
    expect(':');
    next();
    obj[name] = walk();
  }
  next();
  return obj;
}


function parse_array () {
  var array = [];
  var started;
  while(!is(']')){
    if (started) {
      expect(',');
      next();
    }
    started = true;
    array.push(walk());
  }
  next();
  return array;
}


function type () {
  if (!current) {
    unexpected_end();
  }

  return current.type === 'Punctuator'
    ? current.value
    : current.type;
}


function is (t) {
  return type() === t;
}


function sort_comment_tokens () {
}

