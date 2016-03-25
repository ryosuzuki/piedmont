var p
var q
var Z

function computeLaplacian(geometry) {
  console.log('Start computeLaplacian')
  var uniq = geometry.uniq;
  var n = uniq.length;

  var cells = geometry.faces.map( function (face) {
    return [
      geometry.map[face.a],
      geometry.map[face.b],
      geometry.map[face.c]
    ]
  })
  var positions = geometry.uniq.map( function (v) {
    return [
      v.vertex.x,
      v.vertex.y,
      v.vertex.z
    ]
  })
  var lapList = meshLaplacian(cells, positions);
  var lapMat = csrMatrix.fromList(lapList);
  var L = lapMat.toDense();

  geometry.laplacian = L;
  /*
  console.log('Start Cholesky decomposition');
  var ccsL = numeric.ccsSparse(L);
  var ccsLU = numeric.ccsLUP(ccsL);
  geometry.ccsLU = ccsLU;
  var LU = numeric.LU(L);
  geometry.LU = LU;
  */
  console.log('Finish computeLaplacian')
  return geometry;
}


