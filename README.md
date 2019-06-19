[![Build Status](https://travis-ci.org/kaelzhang/node-json-parser.svg?branch=master)](https://travis-ci.org/kaelzhang/node-json-parser)
[![Coverage](https://codecov.io/gh/kaelzhang/node-json-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/node-json-parser)

# json-parser

JSON parser to parse JSON object and MAINTAIN comments.

This is a very low level module. For most situations, recommend to use [`comment-json`](https://www.npmjs.org/package/comment-json) instead.

## What's new in `2.0.0`

`json-parser@2.0.0` brings some breaking changes by completely refactoring with [`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)s

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
 before-all
 */
// before-all
{
  // before
  /* before */
  "foo" /* after-prop:foo */ : // after-comma:foo
    1 // after-value:foo
    // after-value:foo
  , // after-comma:foo
  // after-comma: foo
  "bar": [ // before
    // before
    "baz" // after-value:0
    // after-value:0
    , // after-comma: 0
    "quux"
    // after-value:1
  ] // after-value:bar
  // after-value:bar
}
// after-all
```

```js
const parser = require('json-parser')

console.log(parser.parse(content))
```

And the result will be:

```js
{
  // Comments at the top of the file
  [Symbol.for('before-all')]: [{
    type: 'BlockComment',
    value: '\n before-all\n ',
    inline: false
  }, {
    type: 'LineComment',
    value: ' before-all',
    inline: false
  }],

  ...

  [Symbol.for('after-prop:foo')]: [{
    type: 'BlockComment',
    value: ' after-prop:foo ',
    inline: true
  }],

  // The real value
  foo: 1,
  bar: [
    "baz",
    "quux,
    [Symbol.for('after-value:0')]: [{
      type: 'LineComment',
      value: ' after-value:0',
      inline: true
    }, ...]
  ]
}
```

```js
console.log(parser.parse(content, null, true))
```

And the result will be:

```js
{
  foo: 1,
  bar: [
    "baz",
    "quux"
  ]
}
```

## License

MIT
