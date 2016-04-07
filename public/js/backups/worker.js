var ng
var bnd_points = []
var bnd_normals = []
var bnd_2d = []
var outer_faces = []

var THREE

module.exports = function (self) {
  self.onMessage = function (event) {
    var data = event.data
    self.postMessage({ data: data })
  }
}


this.onmessage = function(event) {
  var data = event.data

  THREE = data.THREE
  // var ng = getNewMesh(data.geometry)
  this.postMessage({ data: 'data'});
};



function getNewMesh (geometry, ng) {
  geometry.computeFaceNormals()
  geometry.computeVertexNormals()
  // ng = new THREE.Geometry();

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

  window.overlapIndex = []
  var svgPositions = getSvgPositions()
  svgPositions.forEach( function (positions) {
    positions = round(positions)
    window.positions = positions

    bnd_points = new Array(positions.length)
    bnd_normals = new Array(positions.length)
    bnd_2d = new Array(positions.length)

    for (var i=0; i<selectIndex.length; i++) {
      var faceIndex = selectIndex[i]
      var faceInfo = getFaceInfo(geometry, faceIndex)
      var ouv = geometry.faceVertexUvs[0][faceIndex];

      if (!ouv) ouv = emptyUv
      var triangle = ouv.map( function (v) {
        return [v.x, v.y];
      })

      triangle = round(triangle)

      var points = polygonBoolean(triangle, positions, 'not')

      if (points.length > 1) {
        points = (points[0].length < points[1].length) ? points[0] : points[1]
      } else {
        points = points[0]
      }
      if (points.length <= 3) {
        var points = greinerHormann.intersection(positions, triangle)
        if (points && points.length < 3) { // && va.y > 0) {
          var area = areaPolygon(points[0])
          var triArea = areaPolygon(triangle)
          if (area/triArea > 0) {
            // createHole(faceInfo, positions)
            hoge(faceInfo, positions)
            overlapIndex = _.union(overlapIndex, [faceIndex])
            console.log(area/triArea)
            continue;
          }
        }
      } else {
        s = new Date().getTime();
        // createHole(faceInfo, positions)
        hoge(faceInfo, positions)
        console.log(new Date().getTime() - s)

        overlapIndex = _.union(overlapIndex, [faceIndex])
      }
    }

    createWall()
    createCover()
  })

  for (var faceIndex=0; faceIndex<geometry.faces.length; faceIndex++) {
    if (!bump && overlapIndex.includes(faceIndex)) continue;
    var face = geometry.faces[faceIndex];
    var normal = face.normal;
    var va  = geometry.vertices[face.a];
    var vb  = geometry.vertices[face.b];
    var vc  = geometry.vertices[face.c];
    var num = ng.vertices.length;
    ng.vertices.push(va);
    ng.vertices.push(vb);
    ng.vertices.push(vc);
    var nf = new THREE.Face3(num, num+1, num+2)
    nf.normal = normal
    ng.faces.push(nf)

    /*
    var h = -0.01;
    var v = new THREE.Vector3();
    var h_normal = normal.clone().multiplyScalar(h);
    var outer_a = v.clone().addVectors(va, h_normal)
    var outer_b = v.clone().addVectors(vb, h_normal)
    var outer_c = v.clone().addVectors(vc, h_normal)
    var num = ng.vertices.length;
    ng.vertices.push(outer_a)
    ng.vertices.push(outer_b)
    ng.vertices.push(outer_c)
    // ng.faces.push(new THREE.Face3(num, num+1, num+2))
    // ng.faces.push(new THREE.Face3(num+2, num+1, num+1))
    */
  }
  return ng
}


function round (array) {
  return array.map( function (a) {
    return a.map( function (val) {
      return parseFloat(val.toFixed(5))
    })
  })
}


function roundVector3 (v) {
  var vec = [v.x, v.y, v.z]
  vec = vec.map( function (val) {
    return parseFloat(val.toFixed(5))
  })
  return new THREE.Vector3(vec[0], vec[1], vec[2])
}



var bump = true
function createHole (faceInfo, positions) {
  var faceIndex = faceInfo.faceIndex
  var face = geometry.faces[faceIndex];
  var ouv = geometry.faceVertexUvs[0][faceIndex];
  if (!ouv) ouv = emptyUv
  var triangle = ouv.map( function (v) {
    return [v.x, v.y];
  })
  triangle = round(triangle)
  var diffs = self.greinerHormann.diff(triangle, positions)
  if (bump) {
    diffs = self.greinerHormann.intersection(positions, triangle)
  }
  // if (!diffs) return false
  for (var i=0; i<diffs.length; i++) {
    var diff = diffs[i]
    diff = round(diff)

    var bndMesh
    var d = drawSVG(diff);
    bndMesh = svgMesh3d(d, {
      scale: 1,
      simplify: Math.pow(10, -5),
      customize: true,
    })
    var nuv = bndMesh.positions;
    nuv = round(nuv)

    var nf = bndMesh.cells;
    var nxyz = uvTo3D(nuv, triangle, faceInfo);
    var inner_points = [];
    var outer_points = [];

    // debugger

    for (var j=0; j<nf.length; j++) {
      var num = ng.vertices.length;
      var a = nxyz[nf[j][0]]
      var b = nxyz[nf[j][1]]
      var c = nxyz[nf[j][2]]
      ng.vertices.push(a.vertex)
      ng.vertices.push(b.vertex)
      ng.vertices.push(c.vertex)
      // ng.faces.push(new THREE.Face3(num, num+1, num+2))

      // ng.faces.push(new THREE.Face3(num+2, num+1, num))

      var auv = nuv[nf[j][0]]
      var buv = nuv[nf[j][1]]
      var cuv = nuv[nf[j][2]]

      var ai = getIndex(positions, auv)
      var bi = getIndex(positions, buv)
      var ci = getIndex(positions, cuv)

      if (ai && ai.equal) {
        var index = ai.index
        bnd_points[index] = a.vertex
        bnd_normals[index] = a.normal
        bnd_2d[index] = auv
      }
      if (bi && bi.equal) {
        var index = bi.index
        bnd_points[index] = b.vertex
        bnd_normals[index] = b.normal
        bnd_2d[index] = buv
      }
      if (ci && ci.equal) {
        var index = ci.index
        bnd_points[index] = c.vertex
        bnd_normals[index] = c.normal
        bnd_2d[index] = cuv
      }
      outer_faces.push({
        ai: ai,
        bi: bi,
        ci: ci,
        vertices: [a, b, c]
      })
    }
  }
  return outer_faces
}


function uvTo3D (nuv, triangle, face_info) {
  var va = face_info.va;
  var vb = face_info.vb;
  var vc = face_info.vc;
  var normal = face_info.normal;
  var normal_a = face_info.normal_a;
  var normal_b = face_info.normal_b;
  var normal_c = face_info.normal_c;
  var normal_ab = face_info.normal_ab;
  var normal_bc = face_info.normal_bc;
  var normal_ca = face_info.normal_ca;

  var nxyz = nuv.map(function (uv) {
    var uv_a = triangle[0];
    var uv_b = triangle[1];
    var uv_c = triangle[2];
    var A = [
      [uv_a[0] - uv_c[0], uv_b[0] - uv_c[0]],
      [uv_a[1] - uv_c[1], uv_b[1] - uv_c[1]]
    ];
    var B = [uv[0] - uv_c[0], uv[1] - uv_c[1]];
    var x = numeric.solve(A, B)
    var a = x[0], b = x[1], c = 1-x[0]-x[1];

    var epsilon = Math.pow(10, -2)
    if ( Math.abs(a) < epsilon) a = 0;
    if ( Math.abs(b) < epsilon) b = 0;
    if ( Math.abs(c) < epsilon) c = 0;

    if (a == 0 && b == 0) c = 1;
    if (b == 0 && c == 0) a = 1;
    if (c == 0 && a == 0) b = 1;


    var v = new THREE.Vector3();
    v.x = a*va.x + b*vb.x + c*vc.x;
    v.y = a*va.y + b*vb.y + c*vc.y;
    v.z = a*va.z + b*vb.z + c*vc.z;

    if (a !== 0 && b !== 0 && c == 0) {
      normal = normal_ab
    }
    if (a == 0 && b !== 0 && c !== 0) {
      normal = normal_bc
    }
    if (a !== 0 && b == 0 && c !== 0) {
      normal = normal_ca
    }
    if (a !== 0 && b == 0 && c == 0) {
      normal = normal_a
    }
    if (a == 0 && b !== 0 && c == 0) {
      normal = normal_b
    }
    if (a == 0 && b == 0 && c !== 0) {
      normal = normal_c
    }

    v = roundVector3(v)
    return { vertex: v, normal: normal};
  })
  return nxyz;
}







    /*
    if ((a == 0 || b == 0 || c == 0) && (a !== 1 || b !== 1 || c !== 1)) {
      var exists = false;
      for (var j=0; j<edges.length; j++) {
        var p = edges[j];
        if ( Math.abs(p.x - v.x) < epsilon
          && Math.abs(p.y - v.y) < epsilon
          && Math.abs(p.z - v.z) < epsilon ) {
          v = p;
          exists = true;
          break;
        }
      }
      if (!exists) edges.push(v);
    }
    */
