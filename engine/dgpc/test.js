var fs = require('fs');
var repl = require('repl');
var dgpc = require('./index.js');

var str = fs.readFileSync('data.json', 'utf8');
var json = JSON.parse(str);

var result = dgpc.getMapping(json);

repl.start('> ').context.r = result;


