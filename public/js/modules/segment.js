function segmentObjects () {
  Q.fcall(computeBoundary(geometry))
  .then(computeLaplacian(geometry))
  .then(computeHarmonicField(geometry))
  .then(hoge(geometry))

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

  var hoge = 3;
  for (var i=hoge; i<hoge+1; i++) {
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
    scene.add(a_particles);

    var g = new THREE.Geometry();
    g.vertices = b_edges.map(function (b) {
      return b.vertex;
    })
    var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
    m.color.setHex(Math.random() * 0xffffff);
    var b_particles = new THREE.Points(g, m);
    scene.add(b_particles);

  }

  // for (var i=0; i<geometry.boundary.length; i++) {
  //   var id = geometry.boundary[i];
  //   var bnd = geometry.uniq[id];
  //   g.vertices.push(bnd.vertex);
  // }


}
