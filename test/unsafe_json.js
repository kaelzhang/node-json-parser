/**
 * Created by user on 2017/1/17.
 */

'use strict';

var expect = require('chai').expect;
var parser = require('../')

const fs = require('fs');

const options = {
			unsafe: true,
			debug: true,
		};

const dir = "./test/file/";

describe("parse(unsafe)", function ()
	{
		let list = fs.readdirSync(dir)

//let file = 'unsafe_object.json';

		list.forEach(function (file)
						{
				if (file.match(/^unsafe_.+\.json$/))
				{
					it(file, function (done)
						{
							let j = parser.parse(fs.readFileSync(dir + file).toString(), null, true, options);
							let d = JSON.parse(fs.readFileSync(dir + file + '.dist').toString());

							let o = JSON.stringify(j, null, "\t");

							fs.writeFileSync(dir + '/../temp/' + file, o)

							expect(JSON.parse(o)).to.deep.equal(d);

							done()
						}
					)
				}
			}
		)

	}
)

