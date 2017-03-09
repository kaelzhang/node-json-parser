/**
 * Created by user on 2017/1/18.
 */

const myjson = require('../src');

var perf = require('mocha-benchmark').create({
  Benchmark: require('benchmark'),
  versions: [
    /* order can be important when we introduce test failing options */
    ['JSON', (JSON.__name = 'JSON', JSON)],
    //['old', require('../')],
    ['new', (myjson.__name = 'json-parser', myjson)]
  ],
  /* could be describe */
//  suite: describe,
//  /* or it */
//  test: it,
});

// perf.suite only runs the last version (usually your latest)
perf.suite('libGlobal', function(perf, libGlobal) {

    const fs = require('fs');
  const str = fs.readFileSync("./test/file/" + "unsafe_json.json.dist").toString()

    const options = {
    			unsafe: true,
    			debug: true,
    		};

//    let p = require('../')

//    console.log(p.parse(str, options.reviver, options.remove_comments, options))

//  perf.test('my lib should be fast', function() {
//    //libGlobal.doStuff();
//
//      p.parse(str, options.reviver, options.remove_comments, options);
//
//  });

  // all tests inside compare run for each version
  perf.compare(function(perf, libGlobal) {

    perf.test(libGlobal.__name, function() {
      // libGlobal will be previous then latest

        libGlobal.parse(str, options.reviver, options.remove_comments, options);

    });
  });
});
