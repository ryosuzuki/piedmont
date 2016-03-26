var p
var q
var Z

function computeLaplacian (geometry) {
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

  console.log('Finish computeLaplacian')
  return geometry;
}

function computeLUDecomposition (geometry) {
  console.log('Start computeLUDecomosition')
  var L = geometry.laplacian
  var L_T = numeric.transpose(L)
  var LL = numeric.dot(L_T, L)
  var LU = numeric.LU(LL)
  geometry.LU = LU

  console.log('Finish computeLUDecomposition')
  return geometry

}


