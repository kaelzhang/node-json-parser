'use strict';

Object.assign(module.exports, {
	tokenize: require('./src/tokenize').tokenize,
	parse: require('./src/index').parse,
});
