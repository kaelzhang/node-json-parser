[![Build Status](https://travis-ci.org/kaelzhang/node-json-parser.svg?branch=master)](https://travis-ci.org/kaelzhang/node-json-parser)
[![Coverage](https://codecov.io/gh/kaelzhang/node-json-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/node-json-parser)

This package is **deprecated**, please use [**`comment-json`**](https://github.com/kaelzhang/node-comment-json) instead.

## [comment-json](https://github.com/kaelzhang/node-comment-json)

****

# json-parser

JSON parser to parse JSON object and MAINTAIN comments.

Since `3.0.0`, `json-parser` depends on `comment-json`, and directly use the `parse` method of `comment-json`

## Install

```sh
$ npm i json-parser
```

## Usage

```js
const {parse} = require('json-parser')
```

```ts
parse(text, reviver? = null, remove_comments? = false)
  : object | string | number | boolean | null
```

For details, see [https://github.com/kaelzhang/node-comment-json#parse](https://github.com/kaelzhang/node-comment-json#parse)

## License

MIT
