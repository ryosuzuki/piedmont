import THREE from 'three'
import Numeric from 'numeric'
import _ from 'lodash'
import GreinerHormann from 'greiner-hormann'
import SvgMesh3d from 'svg-mesh-3d'
import PolygonBoolean from '2d-polygon-boolean'
import AreaPolygon from 'area-polygon'

import Geometry from './geometry'

class FaceInfo extends THREE.Face3 {
  constructor (geometry, hash) {
    super()

    this.geometry = geometry
    this.emptyUv = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0, 0)
    ]
    for (let key in hash) {
      this[key] = hash[key]
    }

    this.ouv = this.geometry.faceVertexUvs[0][this.faceIndex];
    if (this.ouv) this.ouv = this.emptyUv
    this.triangle = this.ouv.map( function (v) {
      return [v.x, v.y];
    })
    this.triangle = Geometry.round(this.triangle)
  }

  compute (positions) {
    this.positions = Geometry.round(positions)
    this.points = PolygonBoolean(this.triangle, this.positions, 'not')

    if (this.points.length > 1) {
      this.points = (this.points[0].length < this.points[1].length) ? this.points[0] : this.points[1]
    } else {
      this.points = this.points[0]
    }
    if (this.points.length <= 3) {
      this.points = GreinerHormann.intersection(this.positions, this.triangle)
      if (this.points && this.points.length < 3) { // && va.y > 0) {
        let area = AreaPolygon(this.points[0])
        let triArea = AreaPolygon(this.triangle)
        if (area/triArea > 0) {
          this.createHole()
          // createHole(faceInfo, positions, true)
          this.geometry.overlapIndex = _.union(this.geometry.overlapIndex, [this.faceIndex])
          console.log(area/triArea)
          return false
        }
      }
    } else {
      var s = new Date().getTime();
      this.createHole()
      // createHole(faceInfo, positions, true)
      console.log(new Date().getTime() - s)
      this.geometry.overlapIndex = _.union(this.geometry.overlapIndex, [this.faceIndex])
    }
  }

  createHole () {
    this.diffs = GreinerHormann.intersection(this.positions, this.triangle)
    if (this.geometry.hole) {
      this.diffs = GreinerHormann.diff(this.triangle, this.positions)
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
      var inner_points = [];
      var outer_points = [];

      for (var j=0; j<nf.length; j++) {
        var num = this.geometry.vertices.length;
        var a = nxyz[nf[j][0]]
        var b = nxyz[nf[j][1]]
        var c = nxyz[nf[j][2]]
        this.geometry.vertices.push(a.vertex)
        this.geometry.vertices.push(b.vertex)
        this.geometry.vertices.push(c.vertex)
        if (this.geometry.geometry.hole || hoge) {
          this.geometry.faces.push(new THREE.Face3(num, num+1, num+2))
        } else {
          this.geometry.faces.push(new THREE.Face3(num+2, num+1, num))
        }

        var auv = nuv[nf[j][0]]
        var buv = nuv[nf[j][1]]
        var cuv = nuv[nf[j][2]]

        var ai = Geometry.getIndex(positions, auv)
        var bi = Geometry.getIndex(positions, buv)
        var ci = Geometry.getIndex(positions, cuv)

        if (ai && ai.equal) {
          var index = ai.index
          if (! this.geometry.bnd_points[index]) {
            this.geometry.bnd_points[index] = a.vertex
            this.geometry.bnd_normals[index] = a.normal
            this.geometry.bnd_2d[index] = auv
          }
        } else {
          // debugger
        }
        if (bi  && bi.equal) {
          var index = bi.index
          if (! this.geometry.bnd_points[index]) {
            this.geometry.bnd_points[index] = b.vertex
            this.geometry.bnd_normals[index] = b.normal
            this.geometry.bnd_2d[index] = buv
          }
        } else {
          // debugger
        }
        if (ci && ci.equal) {
          var index = ci.index
          if (! this.geometry.bnd_points[index]) {
            this.geometry.bnd_points[index] = c.vertex
            this.geometry.bnd_normals[index] = c.normal
            this.geometry.bnd_2d[index] = cuv
          }
        } else {
          // debugger
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
    var nxyz = nuv.map(function (uv) {
      var uv_a = this.triangle[0];
      var uv_b = this.triangle[1];
      var uv_c = this.triangle[2];
      var A = [
        [uv_a[0] - uv_c[0], uv_b[0] - uv_c[0]],
        [uv_a[1] - uv_c[1], uv_b[1] - uv_c[1]]
      ];
      var B = [uv[0] - uv_c[0], uv[1] - uv_c[1]];
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
        this.normal = this.normal_ab
      }
      if (a == 0 && b !== 0 && c !== 0) {
        this.normal = this.normal_bc
      }
      if (a !== 0 && b == 0 && c !== 0) {
        this.normal = this.normal_ca
      }
      if (a !== 0 && b == 0 && c == 0) {
        this.normal = this.normal_a
      }
      if (a == 0 && b !== 0 && c == 0) {
        this.normal = this.normal_b
      }
      if (a == 0 && b == 0 && c !== 0) {
        this.normal = this.normal_c
      }

      v = Geometry.roundVector3(v)

      if (demo_video) {
        return { vertex: v, normal: this.normal};
      } else {
        return { vertex: v, normal: normal};
      }

    })
    return nxyz;
  }


}

export default FaceInfo