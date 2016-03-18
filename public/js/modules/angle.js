
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
    v.distortion = (2*Math.PI - v.total_angle) / (2*Math.PI);
  })
  console.log('Finish computeAngle')
  return geometry;
}


function getBoundary () {
  var D_M = _.sumBy(geometry.uniq.filter( function (v) {
    return v.distortion > 0;
  }), 'distortion');
  var vertices = _.sortBy(geometry.uniq, 'distortion').reverse();
  var boundary = [];
  var s = 0;
  var i = 0;
  var g = new THREE.Geometry();
  while (s < 0.7*D_M) {
    var bnd = vertices[i];
    boundary.push(bnd.id);
    if (bnd.distortion < 0) break;
    s = s + bnd.distortion;
    i++;
    g.vertices.push(bnd.vertex)
  }
  geometry.boundary = boundary;

  var m = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false, alphaTest: 0.5, transparent: true } );
  m.color.setHSL( 1.0, 0.3, 0.7 );
  var particles = new THREE.Points(g, m);
  scene.add(particles);

}











