// JSON formatting

const esprima = require('esprima')

const tokenize = code => esprima.tokenize(code, {
  comment: true,
  loc: true
})

let tokens
let current
let index
let reviver
let remove_comments
let heading_comments
let last_prop

// Clean memory
const clean = () => {
  tokens.length = 0
  tokens = null
  current = null
  reviver = null
  heading_comments = null
}

const transform = (k, v) => reviver
  ? reviver(k, v)
  : v

const unexpected = () => {
  throw new SyntaxError(`Unexpected token ${current.value.slice(0, 1)}`)
}

const unexpected_end = () => {
  throw new SyntaxError('Unexpected end of input')
}

const next = () => current = tokens[++ index]

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

const parse_object = () => {
  const obj = {}
  let started
  let name
  while (!is('}')) {
    if (started) {
      // key-value pair delimiter
      expect(',')
      next()
    }

    started = true
    expect('String')
    last_prop = JSON.parse(current.value)

    next()
    expect(':')
    next()
    obj[name] = transform(name, walk())
  }
  next()
  return obj
}

const parse_array = () => {
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

function walk () {
  let tt = type()
  let negative = ''

  // -1
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
    unexpected()
  }
}

// - prefix `string`
const parse_comments = (prefix, host) => {
  const comments = []

  while (is('LineComment') || is('BlockComment')) {
    comments.push(current)
    next()
  }

  if (comments.length) {
    heading_comments = comments
  }
}

const parse = (code, rev, no_comments) => {
  tokens = tokenize(code)
  reviver = rev
  remove_comments = no_comments

  if (!tokens.length) {
    unexpected_end()
  }

  // sort_comment_tokens()

  index = - 1
  next()

  parse_heading_comments()

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

  clean()

  return result
}

// function sort_comment_tokens () {
//   const ts = tokens
//   const {comments} = ts
//   if (!comments) {
//     return
//   }

//   let ci = 0

//   function compare_to_then_push (condition, to, setup) {
//     let comment
//     let first = true
//     let host
//     while ((comment = comments[ci ++]) && condition(comment, to)) {
//       if (first) {
//         host = setup()
//       }
//       first = false
//       host.push(comment_content(comment))
//     }

//     ci --
//     // Whether there are comments left.
//     return !!comment
//   }

//   const head_comments = []
//   const foot_comments = []

//   const first = ts[0]
//   let comment = compare_to_then_push(left, first, () => head_comments)

//   let i = 0
//   let token
//   let next_token

//   for (; i < ts.length; i ++) {
//     if (!comment) {
//       break
//     }

//     token = ts[i]
//     next_token = ts[i + 1]

//     if (token.type === 'String' && next_token && next_token.value === ':') {
//       comment = compare_to_then_push(left, token, () => {
//         token.comments || (token.comments = [])
//         return token.comments[0] || (token.comments[0] = [])
//       })

//       if (!comment) {
//         break
//       }

//       comment = compare_to_then_push(right, token, () => {
//         token.comments || (token.comments = [])
//         return token.comments[1] || (token.comments[1] = [])
//       })
//     }
//   }

//   compare_to_then_push(() => true, null, () => foot_comments)

//   comments.length = 0
//   delete ts.comments

//   tokens.head_comments = head_comments
//   tokens.foot_comments = foot_comments
// }

// const left = (a, b) => a
//   && (
//     a.loc.start.line < b.loc.start.line
//     || a.loc.start.line === b.loc.start.line
//       && a.loc.start.column < b.loc.start.column
//   )

// const right = (a, b) => a
//   && a.loc.start.line === b.loc.start.line
//   && a.loc.start.column > b.loc.start.column

// const comment_content = comment => comment.type === 'Block'
//   ? `/*${comment.value}*/`
//   : `//${comment.value}`

module.exports = {
  parse,
  tokenize
}
