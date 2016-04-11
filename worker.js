
var window = {}
self.importScripts('/public/js/modules/build.js')
self.importScripts('/public/js/modules/svg-mesh.js')
self.importScripts('/bower_components/lodash/lodash.js')
self.importScripts('/bower_components/three.js/build/three.js')
self.importScripts('/bower_components/greiner-hormann/dist/greiner-hormann.js')
self.importScripts('/bower_components/numericjs/src/numeric.js')


// self.importScripts('/node_modules/paper/dist/paper-node.js')


var demo_video = true


var h = 0.03

var bnd_points
var bnd_normals
var bnd_2d
var bnd_faces = []
var outer_faces = []
var outer_points = []
var outer_bnd_points = []

var overlapIndex = []

var z = new THREE.Vector2(0, 0)
var emptyUv = [z, z, z]



var greinerHormann = window.greinerHormann

var loadSvg = window.loadSvg
var parsePath = window.parsePath
var reindex = window.reindex
var unindex = window.unindex
var meshLaplacian = window.meshLaplacian
var csrMatrix = window.csrMatrix
var drawTriangles = window.drawTriangles
var svgIntersections = window.svgIntersections
var polygonBoolean = window.polygonBoolean
var inside = window.inside
var ghClip = window.ghClip
var triangulate3D = window.triangulate3D
var triangulateContours = window.triangulateContours
var cdt2d = window.cdt2d
var parseSVG = window.parseSVG
var getContours = window.getContours
var getBounds = window.getBounds
var cleanPSLG = window.cleanPSLG
var simplify = window.simplify
var random = window.random
var assign = window.assign
var normalize = window.normalize
var areaPolygon = window.areaPolygon
var Dijkstra = window.Dijkstra



var ng = new THREE.Geometry()
var geometry
var svgPositions
var selectIndex
var hole

this.onmessage = function(event) {
  var data = event.data
  var json = JSON.parse(data)
  hole = json.hole
  if (hole) h = -h
  svgPositions = json.svgPositions
  geometry = json.geometry
  selectIndex = json.selectIndex

  geometry.faces = json.faces
  geometry.faceVertexUvs = json.faceVertexUvs
  geometry.vertices = json.vertices
  geometry.uniq = json.uniq
  geometry.map = json.map

  // debugger
  ng = fugafuga(svgPositions)
  this.postMessage({ ng: ng});
};


function fugafuga (svgPositions) {
  svgPositions.forEach( function (positions) {
    positions = round(positions)

    bnd_points = new Array(positions.length)
    bnd_normals = new Array(positions.length)
    bnd_2d = new Array(positions.length)


    var hogehoge = []

    for (var i=0; i<selectIndex.length; i++) {
      var faceIndex = selectIndex[i]
      var faceInfo = getFaceInfo(geometry, faceIndex)
      var ouv = geometry.faceVertexUvs[0][faceIndex];

      if (!ouv) ouv = emptyUv
      var triangle = ouv.map( function (v) {
        return [v.x, v.y];
      })

      triangle = round(triangle)

      /*
      for (var j=0; j<positions.length; j++) {
        var p = positions[j]
        if (inside(p, triangle)) hogehoge.push(faceIndex)
      }
      */

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
            // createHole(faceInfo, positions, true)
            overlapIndex = _.union(overlapIndex, [faceIndex])
            console.log(area/triArea)
            continue;
          }
        }
      } else {
        s = new Date().getTime();
        createHole(faceInfo, positions)
        // createHole(faceInfo, positions, true)
        console.log(new Date().getTime() - s)

        overlapIndex = _.union(overlapIndex, [faceIndex])
      }
    }


    // checkRemaining(positions)

    // debugger

    if (!hole) {
      createWall()
      createCover()
    }




  })

  for (var faceIndex=0; faceIndex<geometry.faces.length; faceIndex++) {
    if (hole && overlapIndex.includes(faceIndex)) continue;
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

  console.log({
    outer_bnd_length: outer_bnd_points.length,
    outer_length: outer_points.length,
    outer_bnd_points: outer_bnd_points,
    outer_points: outer_points
  })

  return ng
}


function checkRemaining (positions) {
  var null_index = []
  for (var i=0; i<bnd_points.length; i++) {
    var p = bnd_points[i]
    if (!p) null_index.push(i)
  }

  hogehoge = overlapIndex // _.uniq(hogehoge)
  var should_check = []
  for (var i=0; i<null_index.length; i++) {
    var index = null_index[i]
    var p = positions[index]
    p = p.map( function (val) {
      return parseFloat(val.toFixed(5))
    })
    for (var j=0; j<hogehoge.length; i++) {
      var faceIndex = hogehoge[i]
      // var faceInfo = getFaceInfo(geometry, faceIndex)
      var ouv = geometry.faceVertexUvs[0][faceIndex]
      if (!ouv) {
        console.log('skip')
        continue
      }
      var triangle = ouv.map( function (v) {
        return [v.x, v.y];
      })
      if (inside(p, triangle)) {
        should_check.push({
          faceIndex: faceIndex,
          position: p,
          index: index,
          triangle: triangle
        })
        break
      }
    }
  }

  // debugger
  for (var i=0; i<should_check.length; i++) {
    var faceIndex = should_check[i].faceIndex
    var faceInfo = getFaceInfo(geometry, faceIndex)
    var triangle = should_check[i].triangle
    var position = should_check[i].position
    var nxyz = uvTo3D([position], triangle, faceInfo);
    console.log(nxyz)

    var index = should_check[i].index
    bnd_points[index] = nxyz[0].vertex
    bnd_normals[index] = nxyz[0].normal
    bnd_2d[index] = position
  }

}



function round (array) {
  return array.map( function (a) {
    return a.map( function (val) {
      return val // parseFloat(val.toFixed(5))
    })
  })
}



function roundVector3 (v) {
  var vec = [v.x, v.y, v.z]
  vec = vec.map( function (val) {
    return val // parseFloat(val.toFixed(5))
  })
  return new THREE.Vector3(vec[0], vec[1], vec[2])
}


function createBoundary (faceInfo, positions) {
  createHole(faceInfo, positions, 'hole')

}

function createHole (faceInfo, positions, hoge) {
  var faceIndex = faceInfo.faceIndex
  var face = geometry.faces[faceIndex];
  var ouv = geometry.faceVertexUvs[0][faceIndex];
  if (!ouv) ouv = emptyUv
  var triangle = ouv.map( function (v) {
    return [v.x, v.y];
  })
  triangle = round(triangle)
  var diffs = greinerHormann.intersection(positions, triangle)
  if (hole || hoge) {
    diffs = greinerHormann.diff(triangle, positions)
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

    for (var j=0; j<nf.length; j++) {
      var num = ng.vertices.length;
      var a = nxyz[nf[j][0]]
      var b = nxyz[nf[j][1]]
      var c = nxyz[nf[j][2]]
      ng.vertices.push(a.vertex)
      ng.vertices.push(b.vertex)
      ng.vertices.push(c.vertex)
      if (hole || hoge) {
        ng.faces.push(new THREE.Face3(num, num+1, num+2))
      }

      ng.faces.push(new THREE.Face3(num+2, num+1, num))

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
      } else {
        // debugger
      }
      if (bi  && bi.equal) {
        var index = bi.index
        bnd_points[index] = b.vertex
        bnd_normals[index] = b.normal
        bnd_2d[index] = buv
      } else {
        // debugger
      }
      if (ci && ci.equal) {
        var index = ci.index
        bnd_points[index] = c.vertex
        bnd_normals[index] = c.normal
        bnd_2d[index] = cuv
      } else {
        // debugger
      }
      outer_faces.push({
        ai: ai,
        bi: bi,
        ci: ci,
        vertices: [a, b, c]
      })
    }
  }
}

function createWall () {
  // try {
    // ng.computeFaceNormals()
    // ng.computeVertexNormals()

    outer_bnd_points = bnd_points.map( function (inner, index) {
      if (!inner) return undefined
      var normal = bnd_normals[index]
      var v = new THREE.Vector3();
      var h_normal = normal.clone().multiplyScalar(h);
      var outer = v.clone().addVectors(inner, h_normal)
      return outer
    })

    var inner_points = _.compact(bnd_points)
    outer_points = _.compact(outer_bnd_points)


    // debugger
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
      ng.faces.push(new THREE.Face3(num, num+1, num+2))
      // For outer wall

      ng.faces.push(new THREE.Face3(num+2, num+1, num))

      var num = ng.vertices.length;
      ng.vertices.push(c_outer);
      ng.vertices.push(n_outer);
      ng.vertices.push(n_inner);
      ng.faces.push(new THREE.Face3(num, num+1, num+2))

      ng.faces.push(new THREE.Face3(num+2, num+1, num))
    }
  // }
  // catch (err) {
  //   console.log(err)
  // }
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


function drawSVG (points) {

  var path = '';
  for (var i=0; i<points.length; i++){
    path += (i && 'L' || 'M') + points[i]
  }
  var d = path


  // path = new paper.Path();
  // path.strokeColor = 'black';
  // for (var i=0; i<points.length; i++) {
  //   var point = points[i];
  //   var next = points[(i+1)%points.length];
  //   path.moveTo(new paper.Point(point[0], point[1]))
  //   path.lineTo(new paper.Point(next[0], next[1]))
  // }
  // path.closed = true;
  // paper.view.draw();
  // var d = $(path.exportSVG()).attr('d')





  // TODO: Combine these two code
  /*
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
  */
  return d;
}

function getFaceInfo (geometry, faceIndex) {
  var face = geometry.faces[faceIndex]
  var va  = geometry.vertices[face.a]
  var vb  = geometry.vertices[face.b]
  var vc  = geometry.vertices[face.c]
  va = new THREE.Vector3(va.x, va.y, va.z)
  vb = new THREE.Vector3(vb.x, vb.y, vb.z)
  vc = new THREE.Vector3(vc.x, vc.y, vc.z)
  var normal = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z)
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
    return { index: index, equal: false }

    /*
    if (min < epsilon) {
      return { index: index, equal: false }
    } else {
      return false
    }
    */
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
    // debugger
    return false
  }
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

    if (demo_video) {
      return { vertex: v, normal: face_info.normal};
    } else {
      return { vertex: v, normal: normal};
    }

  })
  return nxyz;
}



