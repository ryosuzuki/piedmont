function segmentObjects () {
  Q.fcall(computeBoundary(geometry))
  .then(computeLaplacian(geometry))
  // .then(computeHarmonicField(geometry))
}

function computeHarmonicField(geometry) {
  console.log('Start computeHarmonicField')
  var n = geometry.uniq.length;
  var c = window.bnd_edges.length;
  var w = 1000
  // var b = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);

  var zeros = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0);
  var Z = [];
  for (var i=0; i<n; i++) {
    var z = _.clone(zeros);
    Z.push(z);
  }
  var GG = _.clone(Z);
  for (var i=0; i<c; i++) {
    // var p = a_edges[i].id;
    var p = window.bnd_edges[i]
    GG[p][p] = w*w
  }
  for (var i=0; i<c; i++) {
    // var q = b_edges[i].id
    var q = window.start
    GG[q][q] = w*w
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
    a[window.bnd_edges[i]] = w
    A[n+i] = a
  }
  for (var i=0; i<c; i++) {
    var a = _.clone(z)
    // a[b_edges[i].id] = w
    a[window.start] = w
    A[n+c+i] = a
  }
  var A_T = numeric.transpose(A);

  // var LU = _.clone(geometry.LU)
  // LU.LU = numeric.add(LU.LU, GG)


  // var LU = _.clone(geometry.LU.LU)
  // LU = numeric.add(LU, GG)


  // var update_LU = numeric.LU(LU)

  var B = numeric.dot(A_T, b)
  // var phi = numeric.LUsolve(update_LU, B)
  // geometry.phi = phi;


  var A_A = numeric.dot(A_T, A);
  // var L_T = numeric.transpose(L)
  // var LL = numeric.dot(L_T, L);
  // var M = numeric.add(LL, GG);
  var M_LU = numeric.LU(A_A);
  var phi = numeric.LUsolve(M_LU, B)
  geometry.phi = phi;


  // var A_inv = numeric.inv(A_A);
  // var M = numeric.dot(A_inv, A_T);
  // var phi = numeric.dot(M, b);



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



function computeBoundary (geometry) {
  var D_M = _.sumBy(geometry.uniq.filter( function (v) {
    return v.distortion > 0;
  }), 'distortion');
  var vertices = _.sortBy(geometry.uniq, 'distortion').reverse();
  var boundary = [];
  var s = 0;
  var i = 0;
  while (i < 10) {
    var bnd = vertices[i];
    boundary.push(bnd.id);
    // if (bnd.distortion < 0) break;
    s = s + bnd.distortion;
    i++;
  }
  geometry.boundary = boundary;
  showBoundary(geometry);
  return geometry;
}


function findSimilar (id, checked) {
  var bnd = uniq[id];
  var edges = _.sortBy(bnd.edges, function (e) {
    return uniq[e].distortion;
  }).reverse();
  _.pullAll(edges, checked);
  var eid = edges[0];
  checked.push(eid);
  return eid;
}


function showBoundary (geometry) {

  var checked = [];
  // for (var i=0; i<geometry.boundary.length; i++) {

  // var hoge = 3;
  for (var i=0; i<geometry.boundary.length; i++) {
    var id = geometry.boundary[i];
    var t = 0;
    var bnds = [];
    var a_edges = []
    var b_edges = []
    window.bnds = bnds;

    while (t < 10) {
      if (!uniq[id]) break;
      var bnd = uniq[id];
      bnds.push(bnd)
      id = findSimilar(id, checked);
      t++
    }


    for (var j=0; j<bnds.length-1; j++) {
      var bnd = bnds[j];
      var nnd = bnds[j+1];
      var index = bnd.edges.indexOf(nnd.id);
      var new_ccw_edges = []
      for (var k=0; k<bnd.edges.length; k++) {
        new_ccw_edges.push(bnd.ccw_edges[index])
        index = (index+1) % bnd.edges.length;
      }
      var total = 0;
      var angle_a = bnd.total_angle * 0.25;
      var angle_b = bnd.total_angle * 0.75;
      for (var k=0; k<new_ccw_edges.length; k++) {
        var e = new_ccw_edges[k];
        e.total = total;
        e.a_diff = Math.abs(e.total - angle_a);
        e.b_diff = Math.abs(e.total - angle_b);
        total = total + e.angle;
      }

      var a_edge = _.sortBy(new_ccw_edges, 'a_diff')[0];
      var b_edge = _.sortBy(new_ccw_edges, 'b_diff')[0];

      // if (b_edge.id == 119) debugger;

      a_edges.push(geometry.uniq[a_edge.id]);
      b_edges.push(geometry.uniq[b_edge.id]);

      // var edges = getClockwise(bnd.id);
      // edges.indexOf(nnd.id)


      var v = new THREE.Vector3()
      v.subVectors(nnd.vertex, bnd.vertex).normalize();
      var edge_angles = bnd.edges.map( function (e) {
        var ve = new THREE.Vector3()
        ve.subVectors(uniq[e].vertex, bnd.vertex).normalize();
        var cos = v.dot(ve);
        var angle = Math.acos(cos);
        return angle;
      })
    }

    // TODO: somehow first edges does not work properly
    a_edges.shift()
    b_edges.shift()
    window.a_edges = a_edges;
    window.b_edges = b_edges;

    var g = new THREE.Geometry();
    g.vertices = bnds.map(function (bnd) {
      return bnd.vertex;
    })
    var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
    m.color.setHex(Math.random() * 0xffffff);
    var particles = new THREE.Points(g, m);
    scene.add(particles);

    var g = new THREE.Geometry();
    g.vertices = a_edges.map(function (a) {
      return a.vertex;
    })
    var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
    m.color.setHex(Math.random() * 0xffffff);
    var a_particles = new THREE.Points(g, m);
    // scene.add(a_particles);

    var g = new THREE.Geometry();
    g.vertices = b_edges.map(function (b) {
      return b.vertex;
    })
    var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
    m.color.setHex(Math.random() * 0xffffff);
    var b_particles = new THREE.Points(g, m);
    // scene.add(b_particles);

  }

  // for (var i=0; i<geometry.boundary.length; i++) {
  //   var id = geometry.boundary[i];
  //   var bnd = geometry.uniq[id];
  //   g.vertices.push(bnd.vertex);
  // }


}
