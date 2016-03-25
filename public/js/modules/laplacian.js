var p;//Math.round(Math.random()*n);
var q;//n-1
var Z;


function getField (geometry, p, q) {
  console.log('Start getField')
  if (!p) p = 0;
  if (!q) q = geometry.uniq.length-1;
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map,
    p: p,
    q: q,
  };
  $.ajax({
    url: '/get-laplacian',
    type: 'POST',
    datatype: 'JSON',
    data: {
      json: JSON.stringify(json)
    },
    success: function (data) {
      console.log('Get result');
      console.log(data);
      var phi = data.phi;
      geometry.phi = phi;
      geometry.phiFaces = geometry.faces.map( function (face) {
        var a = phi[map[face.a]];
        var b = phi[map[face.b]];
        var c = phi[map[face.c]];
        return (a+b+c)/3;
      });
      var val = 0.52;
      computeSelect()
      colorChange(val)
      p = undefined;
      q = undefined;
      console.log(current);
      current.object.geometry.colorsNeedUpdate = true;
    }
  });
}



function computeHarmonicField(geometry) {
  console.log('Start computeHarmonicField')
  var n = geometry.uniq.length;
  var c = a_edges.length;
  var w = 1000;
  // var b = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);

  var zeros = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);
  var Z = [];
  for (var i=0; i<n; i++) {
    var z = _.clone(zeros);
    Z.push(z);
  }
  var GG = _.clone(Z);
  for (var i=0; i<c; i++) {
    var p = a_edges[i].id;
    GG[p][p] = w^2;
  }
  for (var i=0; i<c; i++) {
    var q = b_edges[i].id;
    GG[q][q] = w^2;
  }
  // var LU = _.clone(geometry.LU);

  var b = new Array();
  var z = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0)
  for (var i=0; i<n; i++) b[i] = 0
  for (var i=0; i<c; i++) b[n+i] = w
  for (var i=0; i<c; i++) b[n+c+i] = 0

  var L = geometry.laplacian;
  var A = [];
  for (var i=0; i<n; i++) A[i] = L[i]
  for (var i=0; i<c; i++) {
    var a = _.clone(z)
    a[a_edges[i].id] = w
    A[n+i] = a
  }
  for (var i=0; i<c; i++) {
    var a = _.clone(z)
    a[b_edges[i].id] = w
    A[n+c+i] = z
  }
  var A_T = numeric.transpose(A);
  var A_A = numeric.dot(A_T, A);

  var L_T = numeric.transpose(L)
  var LL = numeric.dot(L_T, L);
  var M = numeric.add(LL, GG);

  var LU = numeric.LU(A_A);
  var B = numeric.dot(A_T, b)
  var phi = numeric.LUsolve(LU, B)
  // var A_inv = numeric.inv(A_A);
  // var M = numeric.dot(A_inv, A_T);
  // var phi = numeric.dot(M, b);
  geometry.phi = phi;

  /*
  var A = numeric.add(L, G);
  // var phi = numeric.ccsLUPSolve(geometry.ccsLU, b);
  var LU = numeric.LU(A);
  var phi = numeric.LUsolve(LU, b);
  geometry.phi = phi;
  */

  geometry.phiFaces = geometry.faces.map( function (face) {
    var phi = geometry.phi;
    var a = phi[map[face.a]];
    var b = phi[map[face.b]];
    var c = phi[map[face.c]];
    return (a+b+c)/3;
  });

  console.log('Finish computeHarmonicField')
  return geometry;
}

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

  console.log('Start Cholesky decomposition');
  // var ccsL = numeric.ccsSparse(L);
  // var ccsLU = numeric.ccsLUP(ccsL);
  // geometry.ccsLU = ccsLU;
  // var LU = numeric.LU(L);
  // geometry.LU = LU;

  console.log('Finish computeLaplacian')
  return geometry;
}

