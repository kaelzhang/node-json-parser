const esprima = require('esprima')

exports.tokenize = tokenize
exports.parse = parse

function tokenize (code) {
  const list = esprima.tokenize(code, {
    comment: true,
    loc: true
  })
  if (list.comment) {
    return list
  }

  const result = []
  const comments = []
  list.forEach(t => {
    if (t.type === 'LineComment') {
      t.type = 'Line'
      comments.push(t)
    } else if (t.type === 'BlockComment') {
      t.type = 'Block'
      comments.push(t)
    } else {
      result.push(t)
    }
  })
  result.comments = comments
  return result
}

let tokens
let current
let index
let reviver
let remove_comments

function parse (code, rev, no_comments) {
  tokens = tokenize(code)
  reviver = rev
  remove_comments = no_comments

  if (!tokens.length) {
    unexpected_end()
  }

  sort_comment_tokens()

  index = - 1
  next()

  let result = walk()

  if (Object(result) === result && !remove_comments) {
    if (tokens.head_comments.length) {
      result['//^'] = tokens.head_comments
    }

    if (tokens.foot_comments.length) {
      result['//$'] = tokens.foot_comments
    }
  }

  result = transform('', result)
  reviver = null
  return result
}

function transform (k, v) {
  return reviver
    ? reviver(k, v)
    : v
}

function walk () {
  let tt = type()
  let negative = ''
  if (tt === '-') {
    next()
    tt = type()
    negative = '-'
  }
  switch (tt) {
  case '{':
    next()
    return parse_object()
  case '[':
    next()
    return parse_array()
  case 'String':
  case 'Boolean':
  case 'Null':
  case 'Numeric':
    next()
    return JSON.parse(negative + current.value)
  default:
  }

  unexpected()
}

function next () {
  return current = tokens[++ index]
}

function expect (a) {
  if (!is(a)) {
    unexpected()
  }
}

function unexpected () {
  throw new SyntaxError(`Unexpected token ${current.value.slice(0, 1)}`)
}

function unexpected_end () {
  throw new SyntaxError('Unexpected end of input')
}

function parse_object () {
  const obj = {}
  let started
  let name
  while (!is('}')) {
    if (started) {
      expect(',')
      next()
    }
    started = true
    expect('String')
    name = JSON.parse(current.value)
    if (current.comments && !remove_comments) {
      obj[`// ${name}`] = current.comments
    }
    next()
    expect(':')
    next()
    obj[name] = transform(name, walk())
  }
  next()
  return obj
}

function parse_array () {
  const array = []
  let started
  let i = 0
  while (!is(']')) {
    if (started) {
      expect(',')
      next()
    }
    started = true
    array[i] = transform(i, walk())
    i ++
  }
  next()
  return array
}

function type () {
  if (!current) {
    unexpected_end()
  }

  return current.type === 'Punctuator'
    ? current.value
    : current.type
}

function is (t) {
  return type() === t
}

function sort_comment_tokens () {
  const ts = tokens
  const {comments} = ts
  if (!comments) {
    return
  }

  let ci = 0

  function compare_to_then_push (condition, to, setup) {
    let comment
    let first = true
    let host
    while ((comment = comments[ci ++]) && condition(comment, to)) {
      if (first) {
        host = setup()
      }
      first = false
      host.push(comment_content(comment))
    }

    ci --
    // Whether there are comments left.
    return !!comment
  }

  const head_comments = []
  const foot_comments = []

  const first = ts[0]
  let comment = compare_to_then_push(left, first, () => head_comments)

  let i = 0
  let token
  let next_token

  for (; i < ts.length; i ++) {
    if (!comment) {
      break
    }

    token = ts[i]
    next_token = ts[i + 1]

    if (token.type === 'String' && next_token && next_token.value === ':') {
      comment = compare_to_then_push(left, token, () => {
        token.comments || (token.comments = [])
        return token.comments[0] || (token.comments[0] = [])
      })

      if (!comment) {
        break
      }

      comment = compare_to_then_push(right, token, () => {
        token.comments || (token.comments = [])
        return token.comments[1] || (token.comments[1] = [])
      })
    }
  }

  compare_to_then_push(() => true, null, () => foot_comments)

  comments.length = 0
  delete ts.comments

  tokens.head_comments = head_comments
  tokens.foot_comments = foot_comments
}

function left (a, b) {
  return a
    && (
      a.loc.start.line < b.loc.start.line
      || a.loc.start.line === b.loc.start.line
        && a.loc.start.column < b.loc.start.column
    )
}

function right (a, b) {
  return a
    && a.loc.start.line === b.loc.start.line
    && a.loc.start.column > b.loc.start.column
}

function comment_content (comment) {
  return comment.type === 'Block'
    ? `/*${comment.value}*/`
    : `//${comment.value}`
}
