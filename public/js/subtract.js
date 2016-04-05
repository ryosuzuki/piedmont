var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  wireframe: true,
})
material.color.set(new THREE.Color('blue'))

var ng;
function go () {
  window.scale = 1/50
  Q.fcall(computeUniq(geometry))
  .then(replaceObject(geometry))
}

function getSvgPositions () {
  var d = mickey.pathData
  var svgMesh = svgMesh3d(d, {
    scale: 1,
    simplify: 0.001,
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


var nm
function replaceObject (geometry) {
  geometry.computeFaceNormals()
  ng = new THREE.Geometry();

  window.overlapIndex = []
  var svgPositions = getSvgPositions()
  svgPositions.forEach( function (positions) {
    positions = round(positions)
    window.positions = positions

    bnd_points = new Array(positions.length)
    bnd_normals = new Array(positions.length)

    for (var i=0; i<selectIndex.length; i++) {
      var faceIndex = selectIndex[i]
      var face = geometry.faces[faceIndex];
      var ouv = geometry.faceVertexUvs[0][faceIndex];
      var va  = geometry.vertices[face.a];
      var vb  = geometry.vertices[face.b];
      var vc  = geometry.vertices[face.c];
      var normal = face.normal;
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
            createHall(faceIndex, positions)
            overlapIndex = _.union(overlapIndex, [faceIndex])
            console.log(area/triArea)
            continue;
          }
        }
      } else {
        createHall(faceIndex, positions)
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
  var ui = _.map(positions, 0).indexOf(uv[0])
  var vi = _.map(positions, 1).indexOf(uv[1])
  if (ui == -1 || vi == -1) return -1
  if (ui == vi) {
    return ui
  } else {
    if (positions[ui][0] == uv[0] && positions[ui][1] == uv[1]) {
      return ui
    }
    if (positions[vi][0] == uv[0] && positions[vi][1] == uv[1]) {
      return vi
    }
    return -1
  }
}

function createWall () {
  ng.computeFaceNormals()
  ng.computeVertexNormals()

  var outer_bnd_points = bnd_points.map( function (inner, index) {
    if (!inner) return undefined
    var normal = bnd_normals[index]
    var h = 0.1
    var v = new THREE.Vector3();
    var h_normal = normal.clone().multiplyScalar(h);
    var outer = v.clone().addVectors(inner, h_normal)
    return outer
  })

  var inner_points = _.compact(bnd_points)
  var outer_points = _.compact(outer_bnd_points)

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

function createCover () {
  for (var i=0; i<outer_faces.length; i++) {
    var outer_face = outer_faces[i]
    var a = outer_face.vertices[0]
    var b = outer_face.vertices[1]
    var c = outer_face.vertices[2]
    var normal = outer_face.normal

    var h = 0.1
    var v = new THREE.Vector3();
    var h_normal = normal.clone().multiplyScalar(h);
    var a_outer = v.clone().addVectors(a, h_normal)
    var b_outer = v.clone().addVectors(b, h_normal)
    var c_outer = v.clone().addVectors(c, h_normal)

    var num = ng.vertices.length;
    ng.vertices.push(a_outer);
    ng.vertices.push(b_outer);
    ng.vertices.push(c_outer);
    ng.faces.push(new THREE.Face3(num, num+1, num+2))
  }
}

function createHall (faceIndex, positions) {
  var face = geometry.faces[faceIndex];
  var ouv = geometry.faceVertexUvs[0][faceIndex];
  var va = geometry.vertices[face.a];
  var vb = geometry.vertices[face.b];
  var vc = geometry.vertices[face.c];
  var normal = face.normal;
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

    var outer_triangle = triangle.filter(function (t) {
      for (var di=0; di<diff.length; di++) {
        var dp = diff[di];
        if (_.isEqual(dp, t)) return true;
      }
      return false;
    })
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
    var nxyz = uvTo3D(nuv, ouv, va, vb, vc);
    var inner_points = [];
    var outer_points = [];

    // debugger

    for (var j=0; j<nf.length; j++) {
      var num = ng.vertices.length;
      var a = nxyz[nf[j][0]]
      var b = nxyz[nf[j][1]]
      var c = nxyz[nf[j][2]]
      ng.vertices.push(a);
      ng.vertices.push(b);
      ng.vertices.push(c);
      ng.faces.push(new THREE.Face3(num, num+1, num+2))

      var auv = nuv[nf[j][0]]
      var buv = nuv[nf[j][1]]
      var cuv = nuv[nf[j][2]]

      var ai = getIndex(positions, auv)
      var bi = getIndex(positions, buv)
      var ci = getIndex(positions, cuv)

      if (ai !== -1) {
        bnd_points[ai] = a
        bnd_normals[ai] = normal
      }
      if (bi !== -1) {
        bnd_points[bi] = b
        bnd_normals[bi] = normal
      }
      if (ci !== -1) {
        bnd_points[ci] = c
        bnd_normals[ci] = normal
      }

      var outer_face = {
        vertices: [a, b, c],
        normal: normal
      }
      outer_faces.push(outer_face)
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


function uvTo3D (nuv, ouv, va, vb, vc) {
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



