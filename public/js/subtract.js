var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  wireframe: true,
})
material.color.set(new THREE.Color('blue'))

var ng;
function go () {
  window.scale = 1/25
  Q.fcall(computeUniq(geometry))
  .then(replaceObject(geometry))
}

function getSvgPositions () {
  var d = mickey.pathData
  var svgMesh = svgMesh3d(d, {
    scale: 1,
    simplify: Math.pow(10, -5),
    normalize: true
  })
  positions = svgMesh.positions
  /*
    1. scale: [x, y] -> scale * [x, y]
    2. set center: [0, 0] -> [0.5, 0.5] + alpha
  */
  positions = positions.map(function(p) {
    return [ p[0]*scale, p[1]*scale ]
  })
  var svgPositions = []
  window.mickeys.forEach( function (mickey) {
    var uv = convertCanvasToUv(mickey.position)
    var pos = positions.map(function(p) {
      return [ p[0]+uv[0], p[1]+uv[1] ]
    })
    svgPositions.push(pos)
  })
  return svgPositions
}

var z = new THREE.Vector2(0, 0)
var emptyUv = [z, z, z]


function getFaceInfo (geometry, faceIndex) {
  var face = geometry.faces[faceIndex]
  var va  = geometry.vertices[face.a]
  var vb  = geometry.vertices[face.b]
  var vc  = geometry.vertices[face.c]
  var normal = face.normal

  var faces_a = geometry.uniq[geometry.map[face.a]].faces
  var faces_b = geometry.uniq[geometry.map[face.b]].faces
  var faces_c = geometry.uniq[geometry.map[face.c]].faces

  var faces_ab = _.intersection(faces_a, faces_b)
  var faces_bc = _.intersection(faces_b, faces_c)
  var faces_ca = _.intersection(faces_c, faces_a)

  var v = new THREE.Vector3()
  var n1 = geometry.faces[faces_ab[0]].normal
  var n2 = geometry.faces[faces_ab[1]].normal
  var normal_ab = v.clone().addVectors(n1, n2).normalize()

  var n1 = geometry.faces[faces_bc[0]].normal
  var n2 = geometry.faces[faces_bc[1]].normal
  var normal_bc = v.clone().addVectors(n1, n2).normalize()

  var n1 = geometry.faces[faces_ca[0]].normal
  var n2 = geometry.faces[faces_ca[1]].normal
  var normal_ca = v.clone().addVectors(n1, n2).normalize()

  var normal_a = geometry.uniq[geometry.map[face.a]].vertex_normal
  var normal_b = geometry.uniq[geometry.map[face.b]].vertex_normal
  var normal_c = geometry.uniq[geometry.map[face.c]].vertex_normal
  var faceInfo = {
    faceIndex: faceIndex,
    va: va,
    vb: vb,
    vc: vc,
    normal: roundVector3(normal),
    normal_a: roundVector3(normal_a),
    normal_b: roundVector3(normal_b),
    normal_c: roundVector3(normal_c),
    normal_ab: roundVector3(normal_ab),
    normal_bc: roundVector3(normal_bc),
    normal_ca: roundVector3(normal_ca),
  }
  return faceInfo
}


var nm
function replaceObject (geometry) {
  geometry.computeFaceNormals()
  geometry.computeVertexNormals()
  ng = new THREE.Geometry();

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
            createHole(faceInfo, positions)
            overlapIndex = _.union(overlapIndex, [faceIndex])
            console.log(area/triArea)
            continue;
          }
        }
      } else {
        createHole(faceInfo, positions)
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

  // createWall()

  updateMesh(ng)
  window.finishSubtract = true
}
var finishSubtract

function updateMesh (ng) {
  scene.remove(mesh)
  scene.remove(dm)
  scene.remove(cm)
  scene.remove(sm)
  scene.remove(texture)
  scene.remove(nm)

  console.log('done')
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
    wireframe: true
  })
  nm = new THREE.Mesh(ng, material);
  nm.geometry.verticesNeedUpdate = true;
  nm.dynamic = true;
  nm.castShadow = true;
  nm.receiveShadow = true;
  nm.position.x = mesh.position.x;
  nm.position.y = mesh.position.y;
  nm.position.z = mesh.position.z;
  nm.rotation.x = mesh.rotation.x;
  nm.rotation.y = mesh.rotation.y;
  nm.rotation.z = mesh.rotation.z;
  nm.scale.x = mesh.scale.x
  nm.scale.y = mesh.scale.y
  nm.scale.z = mesh.scale.z
  scene.add(nm)
}

var bump = true
var bnd_points
var bnd_normals
var bnd_2d
var bnd_faces = []
var outer_faces = []

function round (array) {
  return array.map( function (a) {
    return a.map( function (val) {
      return parseFloat(val.toFixed(5))
    })
  })
}

function getIndex (positions, uv) {
  var epsilon = Math.pow(10, -2)
  var ui = _.map(positions, 0).indexOf(uv[0])
  var vi = _.map(positions, 1).indexOf(uv[1])
  if (ui == -1 || vi == -1) {
    var diff = positions.map( function (pos) {
      return Math.abs(pos[0] - uv[0]) + Math.abs(pos[1] - uv[1])
    })
    var min = _.min(diff)
    var index = diff.indexOf(min)
    if (min < epsilon) {
      console.log(min)
      console.log(index)
      return { index: index, equal: false }
    } else {
      return false
    }
  }
  if (ui == vi) {
    return { index: ui, equal: true }
  } else {
    if (positions[ui][0] == uv[0] && positions[ui][1] == uv[1]) {
      return { index: ui, equal: true }
    }
    if (positions[vi][0] == uv[0] && positions[vi][1] == uv[1]) {
      return { index: vi, equal: true }
    }
    return false
  }
}

var h = 0.1

function createWall () {
  try {
    ng.computeFaceNormals()
    ng.computeVertexNormals()

    var outer_bnd_points = bnd_points.map( function (inner, index) {
      if (!inner) return undefined
      var normal = bnd_normals[index]
      var v = new THREE.Vector3();
      var h_normal = normal.clone().multiplyScalar(h);
      var outer = v.clone().addVectors(inner, h_normal)
      return outer
    })
    window.outer_bnd_points = outer_bnd_points

    var inner_points = _.compact(bnd_points)
    var outer_points = _.compact(outer_bnd_points)

    window.outer_points = outer_points

    for (var i=0; i<inner_points.length; i++) {
      var ni = (i+1)%inner_points.length
      var c_inner = inner_points[i]
      var n_inner = inner_points[ni]
      var c_outer = outer_points[i]
      var n_outer = outer_points[ni]

      var num = ng.vertices.length;
      ng.vertices.push(c_inner);
      ng.vertices.push(c_outer);
      ng.vertices.push(n_inner);
      // For inner wall
      // ng.faces.push(new THREE.Face3(num, num+1, num+2))
      // For outer wall

      ng.faces.push(new THREE.Face3(num+2, num+1, num))

      var num = ng.vertices.length;
      ng.vertices.push(c_outer);
      ng.vertices.push(n_outer);
      ng.vertices.push(n_inner);
      // ng.faces.push(new THREE.Face3(num, num+1, num+2))

      ng.faces.push(new THREE.Face3(num+2, num+1, num))
    }
  }
  catch (err) {
    console.log(err)
  }
}

function createCover () {
  try {
    var hoge = _.compact(bnd_2d)
    var d = drawSVG(hoge);
    var bndMesh = svgMesh3d(d, {
      scale: 1,
      simplify: Math.pow(10, -5),
      // customize: true,
    })
    var cells = bndMesh.cells

    for (var i=0; i<cells.length; i++) {
      // debugger
      var a_outer = outer_points[cells[i][0]]
      var b_outer = outer_points[cells[i][1]]
      var c_outer = outer_points[cells[i][2]]
      var num = ng.vertices.length;
      ng.vertices.push(a_outer);
      ng.vertices.push(b_outer);
      ng.vertices.push(c_outer);
      ng.faces.push(new THREE.Face3(num, num+1, num+2))
    }
  }
  catch (err) {
    console.log(err)
  }

  /*
  for (var i=0; i<outer_faces.length; i++) {
    var outer_face = outer_faces[i]

    var ai = outer_face.ai
    var bi = outer_face.bi
    var ci = outer_face.ci

    var v = new THREE.Vector3();

    var a_outer
    var b_outer
    var c_outer
    if (ai && outer_bnd_points[ai.index]) {
      a_outer = outer_bnd_points[ai.index]
    } else {
      var a = outer_face.vertices[0]
      var a_h_normal = a.normal.clone().multiplyScalar(h)
      a_outer = v.clone().addVectors(a.vertex, a_h_normal)
    }

    if (bi && outer_bnd_points[bi.index]) {
      b_outer = outer_bnd_points[bi.index]
    } else {
      var b = outer_face.vertices[1]
      var b_h_normal = b.normal.clone().multiplyScalar(h)
      b_outer = v.clone().addVectors(b.vertex, b_h_normal)
    }

    if (ci && outer_bnd_points[ci.index]) {
      c_outer = outer_bnd_points[ci.index]
    } else {
      var c = outer_face.vertices[2]
      var c_h_normal = c.normal.clone().multiplyScalar(h)
      c_outer = v.clone().addVectors(c.vertex, c_h_normal)
    }

    if (!a_outer) debugger

    a_outer = roundVector3(a_outer)
    b_outer = roundVector3(b_outer)
    c_outer = roundVector3(c_outer)

    var num = ng.vertices.length;
    ng.vertices.push(a_outer);
    ng.vertices.push(b_outer);
    ng.vertices.push(c_outer);
    ng.faces.push(new THREE.Face3(num, num+1, num+2))
  }
  */
}

function roundVector3 (v) {
  var vec = [v.x, v.y, v.z]
  vec = vec.map( function (val) {
    return parseFloat(val.toFixed(5))
  })
  return new THREE.Vector3(vec[0], vec[1], vec[2])

}

function createHole (faceInfo, positions) {
  var faceIndex = faceInfo.faceIndex
  var face = geometry.faces[faceIndex];
  var ouv = geometry.faceVertexUvs[0][faceIndex];
  if (!ouv) ouv = emptyUv
  var triangle = ouv.map( function (v) {
    return [v.x, v.y];
  })
  triangle = round(triangle)
  var diffs = greinerHormann.diff(triangle, positions)
  if (bump) {
    diffs = greinerHormann.intersection(positions, triangle)
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

      // if (!ai) {
      //   ai = getIndex(triangle, auv)
      // }
      // if (!bi) {
      //   bi = getIndex(triangle, buv)
      // }
      // if (!ci){
      //   ci = getIndex(triangle, cuv)
      // }


      /*
      if (ai && !ai.equal && !bnd_points[ai.index]) {
        var index = ai.index
        bnd_points[index] = a.vertex
        bnd_normals[index] = a.normal
      }
      if (bi && !bi.equal && !bnd_points[bi.index]) {
        var index = bi.index
        bnd_points[index] = b.vertex
        bnd_normals[index] = b.normal
      }

      if (ci && !ci.equal && !bnd_points[ci.index]) {
        var index = ci.index
        bnd_points[index] = c.vertex
        bnd_normals[index] = c.normal
      }
      */

      outer_faces.push({
        ai: ai,
        bi: bi,
        ci: ci,
        vertices: [a, b, c]
      })
    }
  }
}


function showBndPoints () {
  var g = new THREE.Geometry()
  bnd_points = _.uniq(bnd_points)
  for (var i=0; i<num; i++) {
    if (!bnd_points[i]) continue
    g.vertices.push(bnd_points[i])
  }
  showPoints(g)
  num++
}




// function uvTo3D (nuv, ouv, va, vb, vc) {

//   return nxyz;
// }


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

  /*
  var nxyz = nuv.map(function (uv) {
    var uv_a = ouv[0];
    var uv_b = ouv[1];
    var uv_c = ouv[2];
    var A = [
      [uv_a.x - uv_c.x, uv_b.x - uv_c.x],
      [uv_a.y - uv_c.y, uv_b.y - uv_c.y]
    ];
    var B = [uv[0] - uv_c.x, uv[1] - uv_c.y];
    var x = numeric.solve(A, B)
    var a = x[0], b = x[1]
    // console.log({ a: a, b: b })
    // convert uv to xyz with a, b, 1-a-b

    var v = new THREE.Vector3();
    v.x = a*va.x + b*vb.x + (1-a-b)*vc.x;
    v.y = a*va.y + b*vb.y + (1-a-b)*vc.y;
    v.z = a*va.z + b*vb.z + (1-a-b)*vc.z;
    return v;
  })
  */

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
    // console.log({ a: a, b: b })
    // convert uv to xyz with a, b, 1-a-b


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


function drawSVG (points) {
  path = new paper.Path();
  path.strokeColor = 'black';
  for (var i=0; i<points.length; i++) {
    var point = points[i];
    var next = points[(i+1)%points.length];
    path.moveTo(new paper.Point(point[0], point[1]))
    path.lineTo(new paper.Point(next[0], next[1]))
  }
  path.closed = true;
  paper.view.draw();
  var d = $(path.exportSVG()).attr('d')
  // TODO: Combine these two code
  var points = points.map(function(p) { return [(p[0]+0.75)*200, (-p[1]+0.75)*200]})
  var path2 = new paper.Path();
  path2.strokeColor = 'black';
  for (var i=0; i<points.length; i++) {
    var point = points[i];
    var next = points[(i+1)%points.length];
    path2.moveTo(new paper.Point(point[0], point[1]))
    path2.lineTo(new paper.Point(next[0], next[1]))
  }
  path2.closed = true;
  paper.view.draw();
  return d;
}



