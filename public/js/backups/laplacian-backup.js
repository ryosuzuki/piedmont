var p;//Math.round(Math.random()*n);
var q;//n-1
var Z;

function computeUniq (geometry) {
  console.log('Start computeUniq')
  var map = new Array(geometry.vertices.length);
  var uniq = [];
  var epsilon = Math.pow(10, -1);
  for (var i=0; i<geometry.vertices.length; i++) {
    var vertex = geometry.vertices[i];
    var bool = true;
    var index;
    for (var j=0; j<uniq.length; j++) {
      var e = uniq[j];
      if (
        Math.abs(vertex.x - e.vertex.x) < epsilon
        && Math.abs(vertex.y - e.vertex.y) < epsilon
        && Math.abs(vertex.z - e.vertex.z) < epsilon
        // vertex.equals(e.vertex)
      ) {
        bool = false;
        e.index.push(i);
        map[i] = j;
        break;
      }
    }
    if (bool) {
      uniq.push({ index: [i], vertex: vertex, id: uniq.length });
      map[i] = uniq.length-1;
    }
  }
  geometry.uniq = uniq;
  geometry.map = map;

  window.uniq = uniq;
  window.map = map;
  window.faces = geometry.faces;
  console.log('Finish computeUniq')
  return geometry;
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
  for (var i=0; i<n; i++) {
    b[i] = 0;
  }
  for (var i=0; i<c; i++) {
    b[n+i] = w;
  }
  for (var i=0; i<c; i++) {
    b[n+c+i] = 0;
  }
  var L = geometry.laplacian;
  var A = [];
  for (var i=0; i<n; i++) {
    A[i] = L[i];
  }
  for (var i=0; i<c; i++) {
    var z = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);
    z[a_edges[i].id] = w;
    A[n+i] = z;
  }
  for (var i=0; i<c; i++) {
    var z = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);
    z[b_edges[i].id] = w;
    A[n+c+i] = z;
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

  /*
  var L = [];
  for (var i=0; i<n; ++i) {
    var zeros = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0)
    L.push(zeros);
  }

  for (var i=0; i< uniq.length; i++) {
    var e = uniq[i];
    var edges = e.edges;

    edges.forEach( function (j) {
      if (i == j) {
        L[i][j] = 1;
      } else {
        L[i][j] = -1/edges.length;
      }
    })
  }
  */
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


function computeHamonicField2 (geometry) {
  var zeros = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);
  var G = [];
  for (var i=0; i<n; i++) {
    var g = _.clone(zeros);
    G.push(g);
  }
  G[p][p] = w^2;
  G[q][q] = w^2;

  var P = numeric.ccsSparse(G);

  var L = _.clone(geometry.laplacian);
  var CL = numeric.ccsSparse(L);
  var CL_T = numeric.ccsSparse(numeric.transpose(L));
  var M = numeric.ccsDot(CL_T, CL);

  var A = numeric.ccsadd(M, P);
  var LUP = numeric.ccsLUP(A);

  var b = Array.apply(null, Array(n+2)).map(Number.prototype.valueOf, 0);
  b[n] = w;
  b[n+1] = 0;

  var A = _.clone(geometry.laplacian);
  var c = 1;
  for (var i=0; i<2*c; i++) {
    var a = _.clone(zeros)
    A.push(a);
  }
  A[n][p] = 1;
  A[n+1][q] = 1;

  // var M = numeric.ccsSparse(A);
  // var LUP = numeric.ccsLUP(M);
  // var x = numeric.ccsLUPSolve(LUP, b)

  // [[1, 0]]   = [1, 0]
  //
  // [[1], [0]] = |1|
  //              |0|
  //
  // (0,0) (0,1)
  // (1.0) (1.1)
  // (2,0) (2,1)
  // ...
  // (n,0) (n,1)

  console.log('Start calculation')
  var A_T = numeric.transpose(A);
  console.log('M')
  var M = numeric.dot(A_T, A);
  console.log('Minv')
  var Minv = numeric.inv(M);
  console.log('N')
  var N = numeric.dot(Minv, A_T)
  var phi = numeric.dot(N, b);
  geometry.phi = phi;
  console.log('Finish clculation')
  return callback(geometry);
}

