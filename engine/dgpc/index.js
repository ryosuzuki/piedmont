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
  'getMapping':   ['void', ['string', 'pointer']],
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

function getMapping (json) {
  /*
  var json = {
    uniq:     geometry.uniq,
    faces:    geometry.faces,
    map:      geometry.map,
    start:    0
  };
  */
  var str = fs.readFileSync(__dirname + '/data.json', 'utf8');
  json = JSON.parse(str)
  console.log('Start getMapping');
  var n = json.uniq.length;
  if (!json.start) json.start = 0;
  var result = new Result.mapping({
    n: int,
    id: new IntArray(n),
    r: new IntArray(n),
    theta: new IntArray(n)
  });
  lib.getMapping(JSON.stringify(json), result.ref());

  console.log('Get result from C++');
  console.log('Start converting in Node');
  var uv = [];
  for (var i=0; i<result.n; i++) {
    uv[i] = {};
    uv[i].id = result.id[i];
    uv[i].r = result.r[i];
    uv[i].theta = result.theta[i];
  }
  console.log('Finish');
  return { uv: uv };
}


module.exports = dgpc;

