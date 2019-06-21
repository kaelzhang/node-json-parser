const test = require('ava')
const parser = require('../')

test('special: null', t => {
  t.is(parser.parse(`// abc\nnull`), null)
})

test('special: 1', async t => {
  const result = parser.parse(`//abc\n1`)

  t.is(Number(result), 1)
  t.is(result[Symbol.for('before-all')][0].value, 'abc')
})

test('special: "foo"', async t => {
  const result = parser.parse(`//abc\n"foo"`)

  t.is(String(result), 'foo')
  t.is(result[Symbol.for('before-all')][0].value, 'abc')
})

test('special: true', async t => {
  const result = parser.parse(`//abc\ntrue`)

  t.true(Boolean(result))
  t.is(result[Symbol.for('before-all')][0].value, 'abc')
})
