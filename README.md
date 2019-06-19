[![Build Status](https://travis-ci.org/kaelzhang/node-json-parser.svg?branch=master)](https://travis-ci.org/kaelzhang/node-json-parser)
[![Coverage](https://codecov.io/gh/kaelzhang/node-json-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/node-json-parser)

# json-parser

JSON parser to parse JSON object and MAINTAIN comments.

This is a very low level module. For most situations, recommend to use [`comment-json`](https://www.npmjs.org/package/comment-json) instead.

## What's new in `2.0.0`?



## Install

```sh
$ npm i json-parser
```

## Usage

```js
parser(text, reviver? = null, remove_comments? = false)
```

- **text** `string` The string to parse as JSON. See the [JSON](http://json.org/) object for a description of JSON syntax.
- **reviver?** `Function() | null` Default to `null`. It acts the same as the second parameter of [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse). If a function, prescribes how the value originally produced by parsing is transformed, before being returned.
- **remove_comments?** `boolean = false` If true, the parsed JSON Object won't contain comments

Returns the `Object` corresponding to the given JSON text.

content

```js
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
const parser = require('json-parser')

console.log(parser.parse(content))
```

And the result will be:

```js
{
  // Comments at the top of the file
  [Symbol.for('top')]: ['/**\n blah\n */', '// comment at top'],

  // Comments at the bottom of the file
  [Symbol.for('bottom')]: ['// comment at bottom'],

  // Comment for a property is the value of `'// <prop>'`
  '// a': [
    ['// comment for a', '/* block comment */'],
    ['// comment at right']
  ],

  // The real value
  a: 1
}
```

```js
console.log(parser.parse(content, null, true))
```

And the result will be:

```js
{
  a: 1
}
```

## License

MIT
