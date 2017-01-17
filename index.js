'use strict';

var esprima = require('esprima');

exports.tokenize = tokenize;
exports.parse = parse;


function tokenize (code) {
  var list = esprima.tokenize(code, {
    comment: true,
    loc: true
  });
  if (list.comment) {
    return list;
  }

  var result = [];
  var comments = [];
  list.map(function (t) {
    if (t.type === 'LineComment') {
      t.type = 'Line';
      comments.push(t);
    } else if (t.type === 'BlockComment') {
      t.type = 'Block';
      comments.push(t);
    } else {
      result.push(t);
    }
  });
  result.comments = comments;
  return result;
}

var tokens;
var current;
var index;
var reviver;
var remove_comments;

let options = {
  debug: false,
  unsafe: false,
};

function parse (code, rev, no_comments, opt) {
  tokens = tokenize(code);
  reviver = rev;
  remove_comments = no_comments;

  options = Object.assign({}, opt);
  options.unsafe = !!options.unsafe;

  if (!tokens.length) {
    unexpected_end();
  }

  sort_comment_tokens();

  index = -1;
  next();

  var result = walk();

  if (Object(result) === result && !remove_comments) {
    if (tokens.head_comments.length) {
      result['//^'] = tokens.head_comments;
    }

    if (tokens.foot_comments.length) {
      result['//$'] = tokens.foot_comments;
    }
  }

  result = transform('', result);
  reviver = null;
  return result;
}


function transform (k, v) {
  return reviver
    ? reviver(k, v)
    : v;
}


function walk () {
  var tt = type();
  var negative = '';
  if (tt === '-') {
      next();
      tt = type();
      negative = '-';
  }
  switch (tt) {
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
      return JSON.parse((options.unsafe && tt == 'String') ? unsafe_quoted(negative + value) : negative + value);
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
  throw new JsonSyntaxError('Unexpected token ' + current.value.slice(0, 1) + ' in JSON at position ' + current.loc.start.column);
}

function unexpected_end () {
  throw new JsonSyntaxError('Unexpected end of JSON input');
}

function unsafe_quoted(str)
{
  return str.replace(/^'(.*)'$/, function($0, $1)
  {
    let s = '"' + $1.replace(/\\?(")/g, "\\$1").replace(/\\(')/g, "$1") + '"';
    console.log(str, '=', s);
    return s;
  })
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

    if (started && options.unsafe && is('}') && is(',', -1))
	{
      break;
	}

    started = true;
    expect('String');
    name = JSON.parse(options.unsafe ? unsafe_quoted(current.value) : current.value);
    if (current.comments && !remove_comments) {
      obj['// ' + name] = current.comments;
    }
    next();
    expect(':');
    next();
    obj[name] = transform(name, walk());
  }
  next();

  return obj;
}


function parse_array () {
  var array = [];
  var started;
  var i = 0;
  while(!is(']')){
    if (started) {
      expect(',');
      next();
    }

    if (started && options.unsafe && is(']') && is(',', -1))
    {
      break;
    }

    started = true;
    array[i] = transform(i, walk());
    i ++;
  }
  next();
  return array;
}


function type (offset) {
  if (offset)
  {
    let a = tokens[index + offset]

    return (a && a.type === 'Punctuator'
      ? a.value
      : a.type) || void(0);
  }

  if (!current) {
    unexpected_end();
  }

  return current.type === 'Punctuator'
    ? current.value
    : current.type;
}


function is (t, offset) {
  return type(offset) === t;
}


function sort_comment_tokens () {
  var ts = tokens;
  var comments = ts.comments;
  if (!comments) {
    return;
  }

  function compare_to_then_push (condition, to, setup) {
    var comment;
    var first = true;
    var host;
    while((comment = comments[ci ++]) && condition(comment, to)){
      if (first) {
        host = setup();
      }
      first = false;
      host.push(comment_content(comment));
    }

    ci --;
    // Whether there are comments left.
    return !!comment;
  }

  var head_comments = [];
  var foot_comments = [];

  var first = ts[0];
  var ci = 0;
  var comment = compare_to_then_push(left, first, function () {
    return head_comments;
  });

  var i = 0;
  var token;
  var next;
  for (; i < ts.length; i ++) {
    if (!comment) {
      break;
    }

    token = ts[i];
    next = ts[i + 1];

    if (token.type === 'String' && next && next.value === ':') {
      comment = compare_to_then_push(left, token, function () {
        token.comments || (token.comments = []);
        return token.comments[0] || (token.comments[0] = []);
      });

      if (!comment) {
        break;
      }

      comment = compare_to_then_push(right, token, function () {
        token.comments || (token.comments = []);
        return token.comments[1] || (token.comments[1] = []);
      });
    }
  }

  compare_to_then_push(function () {
    return true
  }, null, function () {
    return foot_comments;
  });

  comments.length = 0;
  delete ts.comments;

  tokens.head_comments = head_comments;
  tokens.foot_comments = foot_comments;
}


function left (a, b) {
  return a
    && (
      a.loc.start.line < b.loc.start.line
      ||
        a.loc.start.line === b.loc.start.line
        && a.loc.start.column < b.loc.start.column
    );
}


function right (a, b) {
  return a
    && a.loc.start.line === b.loc.start.line
    && a.loc.start.column > b.loc.start.column;
}


function comment_content (comment) {
  return comment.type === 'Block'
    ? '/*' + comment.value + '*/'
    : '//' + comment.value;
}

class JsonSyntaxError extends SyntaxError {
  constructor(message) {
    super(message);

    if (options.debug)
    {
        this.message += "\n\n" + JSON.stringify({
          index: index,
          current: current,
          prev: tokens[index-1],
          next: tokens[index+1]
        }, null, "\t")
    }
  }
}
