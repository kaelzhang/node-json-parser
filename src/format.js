/* eslint-disable */

// All cases

const formattedJson =

// before
{
  // before
  "foo" /* inline-after-prop:foo */ : /* inline-after-colon:foo */ "bar" /* inline-after-value:foo */
  // after-value: foo
  , // inline-after-comma:foo
  // after-comma:foo
  // after-comma:foo
  "bar": [
    // before
    "baz"
    // after-value:baz
  ], /* inline-after-comma: foo
line 2
line 3 */
  "baz" // inline-after-prop:baz
  // after-prop:baz
    : "quux"
  // after:baz
} // inline-after
// after
