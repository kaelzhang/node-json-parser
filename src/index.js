// JSON formatting

const esprima = require('esprima')

const tokenize = code => esprima.tokenize(code, {
  comment: true,
  loc: true
})

const previous_hosts = []
let comments_host = null

let inline = false
let tokens = null
let current = null
let index
let reviver = null
let last_prop

// Clean memory
const clean = () => {
  tokens.length =
  previous_hosts.length = 0

  comments_host =
  tokens =
  current =
  reviver = null
}

const PREFIX_BEFORE = 'before'
const PREFIX_AFTER_PROP = 'after-prop'
const PREFIX_AFTER_COLON = 'after-colon'
const PREFIX_AFTER_COMMA = 'after-comma'
const PREFIX_AFTER_VALUE = 'after-value'
const PREFIX_AFTER = 'after'
const INLINE = 'inline-'

const symbolFor = prefix => Symbol.for(
  last_prop
    ? `${prefix}:${last_prop}`
    : prefix
)

const transform = (k, v) => reviver
  ? reviver(k, v)
  : v

const unexpected = () => {
  const error = new SyntaxError(`Unexpected token ${current.value.slice(0, 1)}`)
  Object.assign(error, current.loc.start)

  throw error
}

const unexpected_end = () => {
  throw new SyntaxError('Unexpected end of input')
}

const next = () => {
  const new_token = tokens[++ index]
  inline = current
    && new_token
    && current.loc.end.line === new_token.loc.start.line

  current = new_token
}

const type = () => {
  if (!current) {
    unexpected_end()
  }

  return current.type === 'Punctuator'
    ? current.value
    : current.type
}

const is = t => type() === t

const expect = a => {
  if (!is(a)) {
    unexpected()
  }
}

const set_comments_host = new_host => {
  previous_hosts.push(comments_host)
  comments_host = new_host
}

const restore_comments_host = () => {
  comments_host = previous_hosts.pop()
}

const parse_comments = prefix => {
  const inline_comments = []
  const comments = []

  while (
    current
    && (
      is('LineComment')
      || is('BlockComment')
    )
  ) {
    if (inline) {
      inline_comments.push(current)
    } else {
      comments.push(current)
    }

    next()
  }

  if (inline_comments.length) {
    comments_host[symbolFor(INLINE + prefix)] = inline_comments
  }

  if (comments.length) {
    comments_host[symbolFor(prefix)] = comments
  }
}

const parse_object = () => {
  const obj = {}
  set_comments_host(obj)

  let started
  let name

  parse_comments(PREFIX_BEFORE)

  while (!is('}')) {
    if (started) {
      // key-value pair delimiter
      expect(',')
      next()
      parse_comments(PREFIX_AFTER_COMMA)
    }

    started = true
    expect('String')
    name = last_prop = JSON.parse(current.value)

    next()
    parse_comments(PREFIX_AFTER_PROP)

    expect(':')

    next()
    parse_comments(PREFIX_AFTER_COLON)

    obj[name] = transform(name, walk())
    parse_comments(PREFIX_AFTER_VALUE)
  }

  // bypass }
  next()
  last_prop = undefined
  restore_comments_host()

  return obj
}

const parse_array = () => {
  const array = []
  set_comments_host(array)

  let started
  let i = 0

  parse_comments(PREFIX_BEFORE)

  while (!is(']')) {
    if (started) {
      expect(',')
      next()
      parse_comments(PREFIX_AFTER_COMMA)
    }

    started = true
    last_prop = i

    array[i] = transform(i, walk())
    parse_comments(PREFIX_AFTER_VALUE)

    i ++
  }
  next()
  last_prop = undefined
  restore_comments_host()

  return array
}

function walk () {
  let tt = type()

  if (tt === '{') {
    next()
    return parse_object()
  }

  if (tt === '[') {
    next()
    return parse_array()
  }

  let negative = ''

  // -1
  if (tt === '-') {
    next()
    tt = type()
    negative = '-'
  }

  let v

  switch (tt) {
  case 'String':
  case 'Boolean':
  case 'Null':
  case 'Numeric':
    v = current.value
    next()
    return JSON.parse(negative + v)
  default:
  }
}

const isObject = subject => Object(subject) === subject

const parse = (code, rev, no_comments) => {
  tokens = tokenize(code)
  reviver = rev

  if (!tokens.length) {
    unexpected_end()
  }

  index = - 1
  next()

  set_comments_host({})

  parse_comments(PREFIX_BEFORE)

  let result = walk()

  parse_comments(PREFIX_AFTER)

  if (current) {
    unexpected()
  }

  if (!no_comments && result !== null) {
    if (!isObject(result)) {
      // 1 -> new Number(1)
      // true -> new Boolean(1)
      // "foo" -> new String("foo")

      // eslint-disable-next-line no-new-object
      result = new Object(result)
    }

    Object.assign(result, comments_host)
  }

  restore_comments_host()

  // reviver
  result = transform('', result)

  clean()

  return result
}

module.exports = {
  parse,
  tokenize
}
