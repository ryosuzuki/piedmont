import THREE from 'three'
import Numeric from 'numeric'
import _ from 'lodash'
import GreinerHormann from 'greiner-hormann'
import SvgMesh3d from 'svg-mesh-3d'
import PolygonBoolean from '2d-polygon-boolean'
import AreaPolygon from 'area-polygon'

import Geometry from './geometry'

class Face extends THREE.Face3 {
  constructor (texture, hash) {
    super()

    this.texture = texture
    this.emptyUv = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, 0)
    ]
    for (let key in hash) {
      this[key] = hash[key]
    }

    this.ouv = this.texture.faceVertexUvs[0][this.index];
    if (!this.ouv) this.ouv = this.emptyUv
    this.triangle = this.ouv.map( function (v) {
      return [v.x, v.y];
    })
    this.triangle = Geometry.round(this.triangle)

  }

  compute (positions) {
    this.positions = Geometry.round(positions)
    this.points = PolygonBoolean(this.triangle, this.positions, 'not')

    if (this.points.length > 1) {
      this.points = (this.points[0].length < this.points[1].length)
                    ? this.points[0]
                    : this.points[1]
    } else {
      this.points = this.points[0]
    }
    if (this.points.length <= 3) {
      this.points = GreinerHormann.intersection(this.positions, this.triangle)
      if (this.points && this.points.length < 3) { // && va.y > 0) {
        let area = AreaPolygon(this.points[0])
        let triArea = AreaPolygon(this.triangle)
        if (area/triArea > 0) {
          this.createBoundary()
          this.texture.overlapIndex = _.union(this.texture.overlapIndex, [this.index])
          console.log(area/triArea)
          return false
        }
      }
    } else {
      var s = new Date().getTime();
      this.createBoundary()
      console.log(new Date().getTime() - s)
      this.texture.overlapIndex = _.union(this.texture.overlapIndex, [this.index])
    }
  }

  createBoundary () {
    console.log('Create boundary')
    console.log(this.triangle)
    console.log(this.texture.type)
    switch (this.texture.type) {
      case 'BUMP':
        this.diffs = GreinerHormann.intersection(this.positions, this.triangle)
        break;
      case 'HOLLOW':
        this.diffs = GreinerHormann.diff(this.triangle, this.positions)
        break;
    }
    // if (!diffs) return false
    for (var i=0; i<this.diffs.length; i++) {
      let diff = this.diffs[i]
      diff = Geometry.round(diff)

      let d = Geometry.drawSVG(diff);
      let bndMesh = SvgMesh3d(d, {
        scale: 1,
        simplify: Math.pow(10, -5),
        customize: true,
      })
      let nuv = bndMesh.positions;
      nuv = Geometry.round(nuv)

      var nf = bndMesh.cells;
      var nxyz = this.uvTo3D(nuv);
      var innerPoints = [];
      var outerPoints = [];

      for (var j=0; j<nf.length; j++) {
        var num = this.texture.ng.vertices.length;
        var a = nxyz[nf[j][0]]
        var b = nxyz[nf[j][1]]
        var c = nxyz[nf[j][2]]
        this.texture.ng.vertices.push(a.vertex)
        this.texture.ng.vertices.push(b.vertex)
        this.texture.ng.vertices.push(c.vertex)
        if (this.texture.type === 'BUMP') {
          this.texture.ng.faces.push(new THREE.Face3(num+2, num+1, num))
        } else {
          this.texture.ng.faces.push(new THREE.Face3(num, num+1, num+2))
        }
        var auv = nuv[nf[j][0]]
        var buv = nuv[nf[j][1]]
        var cuv = nuv[nf[j][2]]

        var ai = Geometry.getIndex(this.positions, auv)
        var bi = Geometry.getIndex(this.positions, buv)
        var ci = Geometry.getIndex(this.positions, cuv)

        if (ai && ai.equal) {
          var index = ai.index
          if (! this.texture.boundaryPoints[index]) {
            this.texture.boundaryPoints[index] = a.vertex
            this.texture.boundaryNormals[index] = a.normal
            this.texture.boundary2d[index] = auv
          }
        } else {
          // debugger
        }
        if (bi  && bi.equal) {
          var index = bi.index
          if (! this.texture.boundaryPoints[index]) {
            this.texture.boundaryPoints[index] = b.vertex
            this.texture.boundaryNormals[index] = b.normal
            this.texture.boundary2d[index] = buv
          }
        } else {
          // debugger
        }
        if (ci && ci.equal) {
          var index = ci.index
          if (! this.texture.boundaryPoints[index]) {
            this.texture.boundaryPoints[index] = c.vertex
            this.texture.boundaryNormals[index] = c.normal
            this.texture.boundary2d[index] = cuv
          }
        } else {
          // debugger
        }

        if (this.texture.model === 'house') {
          this.texture.boundaryNormals[index] = this.normal
        }


        // outer_faces.push({
        //   ai: ai,
        //   bi: bi,
        //   ci: ci,
        //   vertices: [a, b, c]
        // })
      }
    }
  }


  uvTo3D (nuv) {
    var nxyz = []
    for (let i=0; i<nuv.length; i++) {
      let uv = nuv[i]
      var uvA = this.triangle[0];
      var uvB = this.triangle[1];
      var uvC = this.triangle[2];
      var A = [
        [uvA[0] - uvC[0], uvB[0] - uvC[0]],
        [uvA[1] - uvC[1], uvB[1] - uvC[1]]
      ];
      var B = [uv[0] - uvC[0], uv[1] - uvC[1]];
      var x = Numeric.solve(A, B)
      var a = x[0], b = x[1], c = 1-x[0]-x[1];

      var epsilon = Math.pow(10, -2)
      if ( Math.abs(a) < epsilon) a = 0;
      if ( Math.abs(b) < epsilon) b = 0;
      if ( Math.abs(c) < epsilon) c = 0;

      if (a == 0 && b == 0) c = 1;
      if (b == 0 && c == 0) a = 1;
      if (c == 0 && a == 0) b = 1;

      var v = new THREE.Vector3();
      v.x = a*this.va.x + b*this.vb.x + c*this.vc.x;
      v.y = a*this.va.y + b*this.vb.y + c*this.vc.y;
      v.z = a*this.va.z + b*this.vb.z + c*this.vc.z;

      if (a !== 0 && b !== 0 && c == 0) {
        this.normal = this.normalAB
      }
      if (a == 0 && b !== 0 && c !== 0) {
        this.normal = this.normalBC
      }
      if (a !== 0 && b == 0 && c !== 0) {
        this.normal = this.normalCA
      }
      if (a !== 0 && b == 0 && c == 0) {
        this.normal = this.normalA
      }
      if (a == 0 && b !== 0 && c == 0) {
        this.normal = this.normalB
      }
      if (a == 0 && b == 0 && c !== 0) {
        this.normal = this.normalC
      }

      v = Geometry.roundVector3(v)

      let enableDemoVideo = true
      if (enableDemoVideo) {
        nxyz.push({ vertex: v, normal: this.normal})
      } else {
        nxyz.push({ vertex: v, normal: normal})
      }

    }
    return nxyz;
  }


}

export default Face