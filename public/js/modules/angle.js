
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
  geometry.uniq = geometry.uniq.map( function (v) {
    var ccw_edges = [];
    var eid = v.edges[1];
    ccw_edges.push(eid);
    var checked_faces = [];
    var index;
    var getNextFace = function (eid) {
      for (var i=0; i<v.angles.length; i++) {
        var angle = v.angles[i];
        if (eid == angle.edges[0]) {
          if (checked_faces.includes(angle.face)) continue;
          index = v.faces.indexOf(angle.face);
          checked_faces.push(angle.face);
          break;
        }
      }
      return index;
    }
    getNextFace(eid); // get first face
    while (true) {
      var angle = v.angles[index];
      var edges = _.clone(angle.edges);
      var next_eid = _.pullAll(edges, ccw_edges)[0]
      if (!next_eid) break;
      ccw_edges.push(next_eid);
      index = getNextFace(next_eid)
    }
    v.ccw_edges = ccw_edges;
    return v;
  });
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


function findSimilar (id, checked) {
  console.log(id);
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
  for (var i=0; i<geometry.boundary.length; i++) {
    var id = geometry.boundary[i];
    var t = 0;
    var bnds = [];
    while (t < 10) {
      if (!uniq[id]) break;
      var bnd = uniq[id];
      bnds.push(bnd)
      id = findSimilar(id, checked);
      t++
    }

    var forward = []
    var backward = []

    for (var j=0; j<bnds.length-1; j++) {
      var bnd = bnds[j];
      var nnd = bnds[j+1];
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
    var g = new THREE.Geometry();
    g.vertices = bnds.map(function (bnd) {
      return bnd.vertex;
    })
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



