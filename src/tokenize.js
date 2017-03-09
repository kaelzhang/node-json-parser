/**
 * Created by user on 2017/1/18.
 */

const esprima = require('esprima');

exports.tokenize = function tokenize(code)
{
	var list = esprima.tokenize(code, {
			comment: true,
			loc: true
		}
	);
	if (list.comment)
	{
		return list;
	}

	var result = [];
	var comments = [];
	list.map(function (t)
		{
			if (t.type === 'LineComment')
			{
				t.type = 'Line';
				comments.push(t);
			}
			else if (t.type === 'BlockComment')
			{
				t.type = 'Block';
				comments.push(t);
			}
			else
			{
				result.push(t);
			}
		}
	);
	result.comments = comments;
	return result;
}
