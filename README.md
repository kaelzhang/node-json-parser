# json-parser [![NPM version](https://badge.fury.io/js/json-parser.svg)](http://badge.fury.io/js/json-parser) [![Build Status](https://travis-ci.org/kaelzhang/node-json-parser.svg?branch=master)](https://travis-ci.org/kaelzhang/node-json-parser) [![Dependency Status](https://gemnasium.com/kaelzhang/node-json-parser.svg)](https://gemnasium.com/kaelzhang/node-json-parser)

JSON parser to parse JSON object and MAINTAIN comments.

This is a very low level module. For most situations, recommend to use [`comment-json`](https://www.npmjs.org/package/comment-json) instead.

## Install

```sh
$ npm install json-parser --save
```

## Usage

content
```
/**
 blah
 */
// comment at top
{
  // comment for a
  /* block comment */
  "a": 1 // comment at right
}
// comment at bottom
```

```js
var parser = require('json-parser');
var object = parser.parse(content);
console.log(object);
```

And the result will be:

```js
{
  // Comments at the top of the file
  '//^': ['/**\n blah\n */', '// comment at top'],

  // Comments at the bottom of the file
  '//$': ['// comment at bottom'],

  // Comment for a property is the value of `'// <prop>'`
  '// a': [
    ['// comment for a', '/* block comment */'],
    ['// comment at right']
  ],

  // The real value
  a: 1
}
```

## License

MIT
