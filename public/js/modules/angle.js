
function computeAngle (geometry) {
  console.log('Start computeAngle')
  for (var fi=0; fi<geometry.faces.length; fi++) {
    var face = geometry.faces[fi];
    var a = geometry.vertices[face.a];
    var b = geometry.vertices[face.b];
    var c = geometry.vertices[face.c];
    var vertices = [face.a, face.b, face.c];
    for (var i=0; i<3; i++) {
      var id = map[vertices[i]];
      var v_i = geometry.vertices[vertices[i]]
      var v_j = geometry.vertices[vertices[(i+1)%3]]
      var v_k = geometry.vertices[vertices[(i+2)%3]]
      var v_ij = new THREE.Vector3();
      var v_ik = new THREE.Vector3();
      v_ij.subVectors(v_j, v_i).normalize();
      v_ik.subVectors(v_k, v_i).normalize();
      var cos_i = v_ij.dot(v_ik);
      var angle_i = Math.acos(cos_i);

      var angle = { face: fi, angle: angle_i };
      if (!geometry.uniq[id].angles) {
        geometry.uniq[id].angles = [];
      }
      geometry.uniq[id].angles.push(angle);
    }
  }
  geometry.uniq.map( function (v) {
    v.total_angle = _.sumBy(v.angles, 'angle');
    v.distortion = Math.abs(2*Math.PI - v.total_angle) / (2*Math.PI);
  })
  console.log('Finish computeAngle')
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
  while (i < 1) {
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


function showBoundary (geometry) {

  var checked = [];
  var findSimilar = function (id) {
    console.log(id);
    var bnd = uniq[id];
    var edges = _.sortBy(bnd.edges, function (e) {
      return uniq[e].distortion;
    }).reverse();
    edges = _.pullAll(edges, checked);
    var eid = edges[0];
    checked.push(eid);
    return eid;
  }

  for (var i=0; i<geometry.boundary.length; i++) {
    var g = new THREE.Geometry();
    var id = geometry.boundary[i];
    var t = 0;
    while (t < 10) {
      if (!uniq[id]) break;
      var bnd = uniq[id];
      g.vertices.push(bnd.vertex);
      id = findSimilar(id);
      t++
    }
    var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
    m.color.setHex(Math.random() * 0xffffff);
    var particles = new THREE.Points(g, m);
    scene.add(particles);
  }

  // for (var i=0; i<geometry.boundary.length; i++) {
  //   var id = geometry.boundary[i];
  //   var bnd = geometry.uniq[id];
  //   g.vertices.push(bnd.vertex);
  // }


}



