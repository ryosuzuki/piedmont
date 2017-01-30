import THREE from 'three'
import _ from 'lodash'
import GreinerHormann from 'greiner-hormann'
import SvgMesh3d from 'svg-mesh-3d'
import PolygonBoolean from '2d-polygon-boolean'
import AreaPolygon from 'area-polygon'

import Geometry from './geometry'

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
    return val //  parseFloat(val.toFixed(3))
  })
  return new THREE.Vector3(vec[0], vec[1], vec[2])
}

const z = new THREE.Vector2(0, 0)
const emptyUv = [z, z, z]

function getIndex (positions, uv) {
  var epsilon = Math.pow(10, -2)
  var ui = _.map(positions, 0).indexOf(uv[0])
  var vi = _.map(positions, 1).indexOf(uv[1])

  var diff = positions.map( function (pos) {
    return Math.abs(pos[0] - uv[0]) + Math.abs(pos[1] - uv[1])
  })
  var min = _.min(diff)
  var index = diff.indexOf(min)
  return { index: index, min: min }



  if (ui == -1 || vi == -1) {
    var diff = positions.map( function (pos) {
      return Math.abs(pos[0] - uv[0]) + Math.abs(pos[1] - uv[1])
    })
    var min = _.min(diff)
    var index = diff.indexOf(min)
    // return { index: index, equal: false }

    if (index === 5) debugger
    if (min < epsilon) {
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
    // debugger
    return false
  }
}

class BumpGeometry extends Geometry {
  constructor () {
    super()

    this.type = 'BUMP' // 'BUMP'
    this.wallHeight = 0.01
    this.boundaryPoints = []
    this.boundaryNormals = []
    this.boundary2d = []
    this.boundaryOuterPoints = []
    this.overlapIndex = []
  }

  generate () {
    this.ng = new BumpGeometry()

    for (let i=0; i<this.svgMeshPositions.length; i++) {
      let positions = this.svgMeshPositions[i]

      this.boundaryPoints = new Array(positions.length)
      this.boundaryNormals = new Array(positions.length)
      this.boundary2d = new Array(positions.length)
      this.boundaryOuterPoints = new Array(positions.length)

      for (var j=0; j<this.selectIndex.length; j++) {
        const index = this.selectIndex[j]
        const face = this.faces[index]
        const faceInfo = this.getFaceInfo(index)

        var ouv = this.faceVertexUvs[0][index];
        if (!ouv) ouv = emptyUv
        var triangle = ouv.map( function (v) {
          return [v.x, v.y];
        })
        triangle = round(triangle)

        var points = PolygonBoolean(triangle, positions, 'not')

        if (points.length > 1) {
          points = (points[0].length < points[1].length) ? points[0] : points[1]
        } else {
          points = points[0]
        }
        if (points.length <= 3) {
          var points = GreinerHormann.intersection(positions, triangle)
          if (points && points.length < 3) { // && va.y > 0) {
            var area = AreaPolygon(points[0])
            var triArea = AreaPolygon(triangle)
            if (area/triArea > 0) {
              this.createBump(faceInfo, positions)
              // createHole(faceInfo, positions, true)
              this.overlapIndex = _.union(this.overlapIndex, [index])
              console.log(area/triArea)
              continue;
            }
          }
        } else {
          this.createBump(faceInfo, positions)
          // createHole(faceInfo, positions, true)
          this.overlapIndex = _.union(this.overlapIndex, [index])
        }
      }

      this.createWall()
      // this.createCover()
    }

    for (var i=0; i<this.faces.length; i++) {
      const index = i
      if (this.type !== 'BUMP' && this.overlapIndex.includes(index)) continue
      const face = this.faces[index];
      const normal = face.normal;
      var va  = this.vertices[face.a];
      var vb  = this.vertices[face.b];
      var vc  = this.vertices[face.c];
      var num = this.ng.vertices.length;
      this.ng.vertices.push(va);
      this.ng.vertices.push(vb);
      this.ng.vertices.push(vc);
      var nf = new THREE.Face3(num, num+1, num+2)
      nf.normal = normal
      this.ng.faces.push(nf)
    }

    console.log({
      boundaryOuterPoints: this.boundaryOuterPoints,
      outerPoints: this.outerPoints
    })
  }

  createBump(faceInfo, positions, hoge) {
    var faceIndex = faceInfo.faceIndex
    var face = this.faces[faceIndex];
    var ouv = this.faceVertexUvs[0][faceIndex];
    if (!ouv) ouv = emptyUv
    var triangle = ouv.map( function (v) {
      return [v.x, v.y];
    })
    triangle = round(triangle)
    var diffs = GreinerHormann.intersection(positions, triangle)

    var vertices = []

    for (var i=0; i<diffs.length; i++) {
      var diff = diffs[i]
      diff = round(diff)

      var bndMesh
      var d = Geometry.drawSVG(diff);
      bndMesh = SvgMesh3d(d, {
        scale: 1,
        simplify: Math.pow(10, -5),
        customize: true,
      })
      var nuv = bndMesh.positions;
      nuv = round(nuv)

      var nf = bndMesh.cells;
      var nxyz = this.uvTo3D(nuv, triangle, faceInfo);
      var inner_points = [];
      var outer_points = [];

      var mins = Array(positions.length).fill(1000000)
      var infos = Array(positions.length)

      console.log(nxyz)

      for (var j=0; j<nf.length; j++) {
        var num = this.ng.vertices.length;
        var a = nxyz[nf[j][0]]
        var b = nxyz[nf[j][1]]
        var c = nxyz[nf[j][2]]
        var auv = nuv[nf[j][0]]
        var buv = nuv[nf[j][1]]
        var cuv = nuv[nf[j][2]]

        // this.ng.vertices.push(a.vertex)
        // this.ng.vertices.push(b.vertex)
        // this.ng.vertices.push(c.vertex)
        // this.ng.faces.push(new THREE.Face3(num+2, num+1, num))

        let v = new THREE.Vector3();
        let wallNormal
        wallNormal = a.normal.clone().multiplyScalar(this.wallHeight);
        let outer_a = v.clone().addVectors(a.vertex, wallNormal)
        wallNormal = b.normal.clone().multiplyScalar(this.wallHeight);
        let outer_b = v.clone().addVectors(b.vertex, wallNormal)
        wallNormal = c.normal.clone().multiplyScalar(this.wallHeight);
        let outer_c = v.clone().addVectors(c.vertex, wallNormal)

        // outer_a = roundVector3(outer_a)
        // outer_b = roundVector3(outer_b)
        // outer_c = roundVector3(outer_c)

        this.ng.vertices.push(outer_a)
        this.ng.vertices.push(outer_b)
        this.ng.vertices.push(outer_c)
        this.ng.faces.push(new THREE.Face3(num+2, num+1, num))

        this.boundaryPoints.push(a.vertex)
        this.boundaryPoints.push(b.vertex)
        this.boundaryPoints.push(c.vertex)
        this.boundaryNormals.push(a.normal)
        this.boundaryNormals.push(b.normal)
        this.boundaryNormals.push(c.normal)
        this.boundary2d.push(auv)
        this.boundary2d.push(buv)
        this.boundary2d.push(cuv)
      }
    }
  }

  createWall () {
    console.log('Create wall')
    for (let i=0; i<this.boundaryPoints.length; i++) {
      let inner = this.boundaryPoints[i]
      if (!inner) continue
      let normal = this.boundaryNormals[i]
      let v = new THREE.Vector3();
      let wallNormal
      if (this.type === 'BUMP') {
        wallNormal = normal.clone().multiplyScalar(this.wallHeight);
      } else {
        wallNormal = normal.clone().multiplyScalar(-this.wallHeight);
      }
      let outer = v.clone().addVectors(inner, wallNormal)
      this.boundaryOuterPoints[i] = outer
    }

    this.innerPoints = _.compact(this.boundaryPoints)
    this.outerPoints = _.compact(this.boundaryOuterPoints)

    // debugger
    for (var i=0; i<this.innerPoints.length; i++) {
      var ni = (i+1)%this.innerPoints.length
      var innerPointCurrent = this.innerPoints[i]
      var innerPointNext = this.innerPoints[ni]
      var outerPointCurrent = this.outerPoints[i]
      var outerPointNext = this.outerPoints[ni]

      var num = this.ng.vertices.length;
      this.ng.vertices.push(innerPointCurrent);
      this.ng.vertices.push(outerPointCurrent);
      this.ng.vertices.push(innerPointNext);
      // For inner wall
      this.ng.faces.push(new THREE.Face3(num, num+1, num+2))
      // For outer wall
      this.ng.faces.push(new THREE.Face3(num+2, num+1, num))

      var num = this.ng.vertices.length;
      this.ng.vertices.push(outerPointCurrent);
      this.ng.vertices.push(outerPointNext);
      this.ng.vertices.push(innerPointNext);
      this.ng.faces.push(new THREE.Face3(num, num+1, num+2))
      this.ng.faces.push(new THREE.Face3(num+2, num+1, num))
    }
  }

  createCover () {
    console.log('Create cover')
    var points = _.compact(this.boundary2d)
    var d = Geometry.drawSVG(points);
    var boundaryMesh = SvgMesh3d(d, {
      scale: 1,
      simplify: Math.pow(10, -5),
      customize: true,
    })
    var cells = boundaryMesh.cells

    for (var i=0; i<cells.length; i++) {
      var outerPointA = this.outerPoints[(cells[i][0]+1)%this.outerPoints.length]
      var outerPointB = this.outerPoints[(cells[i][1]+1)%this.outerPoints.length]
      var outerPointC = this.outerPoints[(cells[i][2]+1)%this.outerPoints.length]
      var num = this.ng.vertices.length;
      this.ng.vertices.push(outerPointA);
      this.ng.vertices.push(outerPointB);
      this.ng.vertices.push(outerPointC);
      this.ng.faces.push(new THREE.Face3(num, num+1, num+2))
      this.ng.faces.push(new THREE.Face3(num+2, num+1, num))
    }
  }


  getFaceInfo (index) {
    var face = this.faces[index]
    var va  = this.vertices[face.a]
    var vb  = this.vertices[face.b]
    var vc  = this.vertices[face.c]
    va = new THREE.Vector3(va.x, va.y, va.z)
    vb = new THREE.Vector3(vb.x, vb.y, vb.z)
    vc = new THREE.Vector3(vc.x, vc.y, vc.z)
    var normal = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z)
    var faces_a = this.uniq[this.map[face.a]].faces
    var faces_b = this.uniq[this.map[face.b]].faces
    var faces_c = this.uniq[this.map[face.c]].faces

    var faces_ab = _.intersection(faces_a, faces_b)
    var faces_bc = _.intersection(faces_b, faces_c)
    var faces_ca = _.intersection(faces_c, faces_a)

    var v = new THREE.Vector3()
    var n1 = this.faces[faces_ab[0]].normal
    var n2 = this.faces[faces_ab[1]].normal
    var normal_ab = v.clone().addVectors(n1, n2).normalize()

    var n1 = this.faces[faces_bc[0]].normal
    var n2 = this.faces[faces_bc[1]].normal
    var normal_bc = v.clone().addVectors(n1, n2).normalize()

    var n1 = this.faces[faces_ca[0]].normal
    var n2 = this.faces[faces_ca[1]].normal
    var normal_ca = v.clone().addVectors(n1, n2).normalize()

    var normal_a = this.uniq[this.map[face.a]].vertexNormal
    var normal_b = this.uniq[this.map[face.b]].vertexNormal
    var normal_c = this.uniq[this.map[face.c]].vertexNormal
    var faceInfo = {
      faceIndex: index,
      va: va,
      vb: vb,
      vc: vc,
      normal: normal,
      normal_a: normal_a,
      normal_b: normal_b,
      normal_c: normal_c,
      normal_ab: normal_ab,
      normal_bc: normal_bc,
      normal_ca: normal_ca,
    }
    return faceInfo
  }

  uvTo3D (nuv, triangle, face_info) {
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

      // a = parseFloat(a.toFixed(1))
      // b = parseFloat(b.toFixed(1))
      // c = parseFloat(c.toFixed(1))

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

      if (!normal) normal = face_info.normal

      v = roundVector3(v)
      normal = roundVector3(normal)
      // if (demo_video) {
        // return { vertex: v, normal: face_info.normal};
      // } else {
        return { vertex: v, normal: normal};
      // }

    })
    return nxyz;
  }


}



export default BumpGeometry