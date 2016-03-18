
function getAngle () {
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
        geometry.uniq[id].distortion = 0;
      }
      geometry.uniq[id].angles.push(angle);
      geometry.uniq[id].distortion += angle_i;
    }
  }
  return geometry;
}