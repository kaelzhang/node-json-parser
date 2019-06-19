/* eslint-disable */

// All cases

const formattedJson =

// before-all
{
  // before:foo
  "foo" /* after-prop:foo */ : /* after-colon:foo */ "bar" /* after-value:foo */, // inline-after-comma:foo
  // before:bar
  // before:bar
  "bar": [
    // before:0
    "baz"
  ], /* inline-after-comma: foo
line 2
line 3 */
  "baz" // after-prop:baz
    : "quux"
  // after
}
// after-all
