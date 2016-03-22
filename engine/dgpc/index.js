var repl = require('repl');
var ffi = require('ffi');
var ref = require('ref');
var _ = require('lodash');
var ArrayType = require('ref-array');
var StructType = require('ref-struct');

var dgpc = {
  getMapping: getMapping,
}
var lib = ffi.Library(__dirname + '/dgpc', {
  'getMapping':   ['void', ['string', 'int', 'pointer']],
});

var int = ref.types.int;
var double = ref.types.double;
var IntArray = ArrayType(int);
var DoubleArray = ArrayType(double);
var Result = {};
Result.mapping = StructType({
  'n': int,
  'id': IntArray,
  'r': DoubleArray,
  'theta': DoubleArray
})

var fs = require('fs');

function getMapping (filename, start) {
  console.log('Start getMapping');
  var size = 600
  var result = new Result.mapping({
    n: int,
    id: new IntArray(size),
    r: new IntArray(size),
    theta: new IntArray(size)
  });
  lib.getMapping(filename, start, result.ref());

  console.log('Get result from C++');
  console.log('Start converting in Node');
  var uv = {};
  for (var i=0; i<result.n; i++) {
    var id = result.id[i]
    var r = result.r[i]
    var theta = result.theta[i]
    var u = r * Math.cos(theta) + 0.5;
    var v = r * Math.sin(theta) + 0.5;
    uv[id] = { r: r, theta: theta, u: u, v: v };
  }
  console.log('Finish');
  return { uv: uv };
}

function getMapping2 (json) {
  /*
  var json = {
    uniq:     geometry.uniq,
    faces:    geometry.faces,
    map:      geometry.map,
    start:    0
  };
  */
  var start = json.start;
  var str = fs.readFileSync(__dirname + '/data.json', 'utf8');
  json = JSON.parse(str)
  json.start = start;
  if (!json.start) json.start = 0;
  console.log('Start getMapping');
  var n = json.uniq.length;
  var result = new Result.mapping({
    n: int,
    id: new IntArray(n),
    r: new IntArray(n),
    theta: new IntArray(n)
  });
  lib.getMapping(JSON.stringify(json), result.ref());

  console.log('Get result from C++');
  console.log('Start converting in Node');
  var uv = {};
  for (var i=0; i<result.n; i++) {
    var id = result.id[i]
    var r = result.r[i]
    var theta = result.theta[i]
    var u = r * Math.cos(theta);
    var v = r * Math.sin(theta);
    uv[id] = { r: r, theta: theta, u: u, v: v };
  }
  console.log('Finish');
  return { uv: uv };
}


module.exports = dgpc;

