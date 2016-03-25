
function computeVertexNormals (geometry) {
  for (var i=0; i<geometry.uniq.length; i++) {
    var v = geometry.uniq[i];
    var vertex_normal = new THREE.Vector3();
    var normals = [];
    for (var j=0; j<v.faces.length; j++) {
      var index = v.faces[j];
      var face = geometry.faces[index];
      var normal = face.normal;
      vertex_normal.add(normal);
      normals.push(normal);
    }
    vertex_normal.divideScalar(v.faces.length).normalize();
    geometry.uniq[i].vertex_normal = vertex_normal;
  }
  return geometry
}


function computeAngle (geometry) {
  console.log('Start computeAngle')
  for (var fi=0; fi<geometry.faces.length; fi++) {
    var face = geometry.faces[fi];
    var a = geometry.vertices[face.a];
    var b = geometry.vertices[face.b];
    var c = geometry.vertices[face.c];
    var vertices = [face.a, face.b, face.c];
    for (var i=0; i<3; i++) {
      var id_i = map[vertices[i]];
      var id_j = map[vertices[(i+1)%3]];
      var id_k = map[vertices[(i+2)%3]];
      var v_i = geometry.uniq[id_i].vertex;
      var v_j = geometry.uniq[id_j].vertex;
      var v_k = geometry.uniq[id_k].vertex;
      var v_ij = new THREE.Vector3();
      var v_ik = new THREE.Vector3();
      v_ij.subVectors(v_j, v_i).normalize();
      v_ik.subVectors(v_k, v_i).normalize();
      var cos_i = v_ij.dot(v_ik);
      var angle_i = Math.acos(cos_i);

      var angle = { face: fi, angle: angle_i, edges: [id_j, id_k] };
      if (!geometry.uniq[id_i].angles) {
        geometry.uniq[id_i].angles = [];
      }
      geometry.uniq[id_i].angles.push(angle);
    }
  }
  geometry.uniq.map( function (v) {
    v.total_angle = _.sumBy(v.angles, 'angle');
    v.distortion = Math.abs(2*Math.PI - v.total_angle) / (2*Math.PI);
  })
  console.log('Finish computeAngle')
  return geometry;
}

function computeCcwEdges (geometry) {
  console.log('Start computeCcwEdges');
  geometry.uniq = geometry.uniq.map( function (v) {
    var ccw_edges = [];
    var eid = v.edges[1];
    var checked_faces = [];
    var checked_edges = [];
    var index;
    var getNextFace = function (eid) {
      for (var i=0; i<v.angles.length; i++) {
        var angle = v.angles[i];
        // if (eid == angle.edges[0]) {
        if (angle.edges.includes(eid)) {
          if (checked_faces.includes(angle.face)) continue;
          index = v.faces.indexOf(angle.face);
          checked_faces.push(angle.face);
          checked_edges.push(eid);
          break;
        }
      }
      return index;
    }
    var addCcwEdge = function (eid, index) {
      var angle = v.angles[index];
      ccw_edges.push({ id: eid, face: angle.face, angle: angle.angle });
    }
    index = getNextFace(eid);
    addCcwEdge(eid, index)
    while (true) {
      var angle = v.angles[index];
      var edges = _.clone(angle.edges);
      var next_eid = _.pullAll(edges, checked_edges)[0]
      // if (!next_eid) break;
      if (!next_eid || next_eid == eid) break;
      eid = next_eid;
      index = getNextFace(eid)
      addCcwEdge(eid, index);
    }
    v.ccw_edges = ccw_edges;
    v.edges = checked_edges;
    return v;
  });
  console.log('Finish computeCcwEdges');
  return geometry;
}




