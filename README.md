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
const {parse} = require('json-parser')

parse(text, reviver? = null, remove_comments? = false): null | object
```

- **text** `string` The string to parse as JSON. See the [JSON](http://json.org/) object for a description of JSON syntax.
- **reviver?** `Function() | null` Default to `null`. It acts the same as the second parameter of [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse). If a function, prescribes how the value originally produced by parsing is transformed, before being returned.
- **remove_comments?** `boolean = false` If true, the parsed JSON Object won't contain comments

Returns `object | null` corresponding to the given JSON text.

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
console.log(parse(content))
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
    }, ...],
    ...
  ]
}
```

There are **SEVEN** kinds of symbol properties:

```js
// comment tokens before the JSON object
Symbol.for('before-all')

// comment tokens before any properties/items inside an object/array
Symbol.for('before')

// comment tokens after property key `prop` and before colon(`:`)
Symbol.for(`after-prop:${prop}`)

// comment tokens after the colon(`:`) of property `prop` and before property value
Symbol.for(`after-colon:${prop}`)

// comment tokens after the value of property `prop`/the item of index `prop`
// and before the key-value/item delimiter(`,`)
Symbol.for(`after-value:${prop}`)

// comment tokens after the comma of `prop`-value pair
// and before the next key-value pair/item
Symbol.for(`after-comma:${prop}`)

// comment tokens after the JSON object
Symbol.for('after-all')
```

And the value of each symbol property is an **array** of `CommentToken`

```ts
interface CommentToken {
  type: 'BlockComment' | 'LineComment'
  // The content of the comment, including whitespaces and line breaks
  value: string
  // If the start location is the same line as the previous token,
  // then `inline` is `true`
  inline: boolean
}
```

### Parse into an object without comments

```js
console.log(parse(content, null, true))
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

### Special cases

```js
const parsed = parse(`
// comment
1
`)

console.log(parsed === 1)
// false
```

If we parse a JSON of primative type with `remove_comments:false`, then the return value of `parse()` will be of object type.

The value of `parsed` is equivalent to:

```js
const parsed = new Number(1)

parsed[Symbol.for('before-all')] = [{
  type: 'LineComment',
  value: ' comment',
  inline: false
}]
```

Which is similar for:

- `Boolean` type
- `String` type

For example

```js
const parsed = parse(`
"foo" /* comment */
`)
```

Which is equivalent to

```js
const parsed = new String('foo')

parsed[Symbol.for('after-all')] = [{
  type: 'BlockComment',
  value: ' comment ',
  inline: true
}]
```

But there is one exception:

```js
const parsed = parse(`
// comment
null
`)

console.log(parsed === null) // true
```

## License

MIT
