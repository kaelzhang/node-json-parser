

const test = require('ava')

const parser = require('../')

// var a = parser.parse('//top\n{// top a\n/* abc */"a":1,//right\n/* bcd */"b":{"a":1}}//bottom');
// // var a = parser.parse('{/*top*/"a":1,//right\n/*abc*/"b":{"a":1}}');
// console.log(a);

const cases = [
  {
    d: 'comment at the top',
    s: '//top\n{"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      t.is(obj[Symbol.for('before-all')][0].value, 'top')
    }
  },
  {
    d: 'multiple comments at the top, both line and block',
    s: '//top\n/*abc*/{"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)

      const [c1, c2] = obj[Symbol.for('before-all')]
      t.is(c1.value, 'top')
      t.is(c1.type, 'LineComment')
      t.is(c2.value, 'abc')
      t.is(c2.type, 'BlockComment')
    }
  },
  {
    d: 'comment at the bottom',
    s: '{"a":1}\n//bot',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c] = obj[Symbol.for('after-all')]
      t.is(c.value, 'bot')
    }
  },
  {
    d: 'multiple comments at the bottom, both line and block',
    s: '{"a":1}\n//top\n/*abc*/',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c1, c2] = obj[Symbol.for('after-all')]
      t.is(c1.value, 'top')
      t.is(c2.value, 'abc')
    }
  },
  {
    d: 'comment for properties',
    s: '{//a\n"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c] = obj[Symbol.for('inline-before')]
      t.is(c.value, 'a')
    }
  },
  {
    d: 'comment for properties, multiple at the top',
    s: '{//a\n/*b*/"a":1}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c1] = obj[Symbol.for('inline-before')]
      const [c2] = obj[Symbol.for('before')]
      t.is(c1.value, 'a')
      t.is(c2.value, 'b')
    }
  },
  {
    d: 'comment for properties, both top and right',
    s: '{//a\n"a":1//b\n}',
    o: '{"a":1}',
    e (t, obj) {
      t.is(obj.a, 1)
      const [c] = obj[Symbol.for('inline-after-value:a')]
      t.is(c.value, 'b')
    }
  },
  {
    // #8
    d: 'support negative numbers',
    s: '{//a\n"a": -1}',
    o: '{"a": -1}',
    e (t, obj) {
      t.is(obj.a, - 1)
    }
  },
  {
    d: 'inline comment after prop',
    s: `{
"a" /* a */: 1
    }`,
    o: '{"a":1}',
    e (t, obj) {
      const [c] = obj[Symbol.for('inline-after-prop:a')]
      t.is(c.value, ' a ')
    }
  },
  {
    d: 'inline comment after comma',
    s: `{
      "a": 1, // a
      "b": 2
    }`,
    o: '{"a":1,"b":2}',
    e (t, obj) {
      t.is(obj.a, 1)
      t.is(obj.b, 2)
      const [c] = obj[Symbol.for('inline-after-comma:a')]
      t.is(c.value, ' a')
    }
  },
  {
    d: 'array',
    s: `{
      "a": /*a*/ [ // b
        //c
        1, // d
        // e
        2
      ] /*
g*/ //g2
      //h
      ,
      "b" /*i*/
      // j
        :
        // k
        1
    } // f`,
    o: `{
      "a": [1, 2],
      "b": 1
    }`,
    e (t, obj) {
      t.is(obj.a[0], 1)
      t.is(obj.a[1], 2)

      const [g, g2] = obj[Symbol.for('inline-after-value:a')]
      t.is(g.value, '\ng')
      t.is(g2.value, 'g2')

      const [h] = obj[Symbol.for('after-value:a')]
      t.is(h.value, 'h')

      const [i] = obj[Symbol.for('inline-after-prop:b')]
      t.is(i.value, 'i')

      const [j] = obj[Symbol.for('after-prop:b')]
      t.is(j.value, ' j')

      const [a] = obj[Symbol.for('inline-after-colon:a')]
      t.is(a.value, 'a')

      const [k] = obj[Symbol.for('after-colon:b')]
      t.is(k.value, ' k')

      const [b] = obj.a[Symbol.for('inline-before')]
      t.is(b.value, ' b')

      const [c] = obj.a[Symbol.for('before')]
      t.is(c.value, 'c')

      const [d] = obj.a[Symbol.for('inline-after-comma:0')]
      t.is(d.value, ' d')

      const [e] = obj.a[Symbol.for('after-comma:0')]
      t.is(e.value, ' e')

      const [f] = obj[Symbol.for('inline-after-all')]
      t.is(f.value, ' f')
    }
  }
]

cases.forEach(c => {
  const tt = c.only
    ? test.only
    : test

  tt(c.d, t => {
    c.e(t, parser.parse(c.s))
  })

  tt(`${c.d}, removes comments`, t => {
    t.deepEqual(parser.parse(c.s, null, true), parser.parse(c.o))
  })
})

const invalid = [
  '{',
  '}',
  '[',
  '',
  '{a:1}',
  '{"a":a}',
  '{"a":undefined}'
]

const removes_position = s => s.replace(/\s+in JSON at position.+$/, '')

// ECMA262 does not define the standard of error messages.
// However, we throw error messages the same as JSON.parse()
invalid.forEach(i => {
  test(`error message:${i}`, t => {
    let error
    let err

    try {
      parser.parse(i)
    } catch (e) {
      error = e
    }

    try {
      JSON.parse(i)
    } catch (e) {
      // console.log(e)
      err = e
    }

    t.is(!!(err && error), true)
    t.is(error.message, removes_position(err.message))
  })
})

// test('reviver', t => {

// })
