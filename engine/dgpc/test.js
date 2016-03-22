var fs = require('fs');
var repl = require('repl');
var dgpc = require('./index.js');
var filename = './mesh/bunny_1k.obj'
var result = dgpc.getMapping(filename, 0);

repl.start('> ').context.r = result;


