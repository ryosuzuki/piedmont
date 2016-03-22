var fs = require('fs');
var repl = require('repl');
var dgpc = require('./index.js');
var filename = './sample.obj'

var result = dgpc.getMapping(filename, 100);

repl.start('> ').context.r = result;


