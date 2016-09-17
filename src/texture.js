import THREE from 'three'
import _ from 'lodash'
import GreinerHormann from 'greiner-hormann'
import SvgMesh3d from 'svg-mesh-3d'

import Geometry from './geometry'

class Texture extends Geometry {
  constructor () {
    super()

    this.hole = true
    this.bnd_points = []
    this.bnd_normals = []
    this.bnd_2d = []
    this.overlapIndex = []
  }

  generate () {
    let ng = new Geometry()

    for (let i=0; i<this.svgPositions.length; i++) {
      let positions = this.svgPositions[i]

      console.log(positions)
      this.bnd_points = new Array(positions.length)
      this.bnd_normals = new Array(positions.length)
      this.bnd_2d = new Array(positions.length)

      for (var i=0; i<this.selectIndex.length; i++) {
        const faceIndex = this.selectIndex[i]
        const faceInfo = this.faces[faceIndex]
        const res = faceInfo.compute(positions)
        if (!res) continue
      }

      if (!this.hole) {
        this.createWall()
        this.createCover()
      }
    }


    for (var i=0; i<this.faces.length; i++) {
      const faceIndex = i
      if (this.hole && this.overlapIndex.includes(faceIndex)) continue
      const face = this.faces[faceIndex];
      const normal = face.normal;
      var va  = this.vertices[face.a];
      var vb  = this.vertices[face.b];
      var vc  = this.vertices[face.c];
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
      outer_bnd_length: this.outer_bnd_points.length,
      outer_length: this.outer_points.length,
      outer_bnd_points: this.outer_bnd_points,
      outer_points: this.outer_points
    })
  }

  createWall () {
    try {
      this.outer_bnd_points = this.bnd_points.map( (inner, index) => {
        if (!inner) return undefined
        var normal = this.bnd_normals[index]
        var v = new THREE.Vector3();
        var h_normal = normal.clone().multiplyScalar(h);
        var outer = v.clone().addVectors(inner, h_normal)
        return outer
      })

      this.inner_points = _.compact(this.bnd_points)
      this.outer_points = _.compact(this.outer_bnd_points)

      // debugger
      for (var i=0; i<this.inner_points.length; i++) {
        var ni = (i+1)%this.inner_points.length
        var c_inner = this.inner_points[i]
        var n_inner = this.inner_points[ni]
        var c_outer = this.outer_points[i]
        var n_outer = this.outer_points[ni]

        var num = this.vertices.length;
        this.vertices.push(c_inner);
        this.vertices.push(c_outer);
        this.vertices.push(n_inner);
        // For inner wall
        this.faces.push(new THREE.Face3(num, num+1, num+2))
        // For outer wall

        this.faces.push(new THREE.Face3(num+2, num+1, num))

        var num = this.vertices.length;
        this.vertices.push(c_outer);
        this.vertices.push(n_outer);
        this.vertices.push(n_inner);
        this.faces.push(new THREE.Face3(num, num+1, num+2))

        this.faces.push(new THREE.Face3(num+2, num+1, num))
      }
    } catch (err) {
      console.log(err)
    }
  }

  createCover () {
    try {
      var points = _.compact(this.bnd_2d)
      var d = Geometry.drawSVG(points);
      var bndMesh = SvgMesh3d(d, {
        scale: 1,
        simplify: Math.pow(10, -5),
        // customize: true,
      })
      var cells = bndMesh.cells

      for (var i=0; i<cells.length; i++) {
        // debugger
        var a_outer = this.outer_points[cells[i][0]]
        var b_outer = this.outer_points[cells[i][1]]
        var c_outer = this.outer_points[cells[i][2]]
        var num = this.vertices.length;
        this.vertices.push(a_outer);
        this.vertices.push(b_outer);
        this.vertices.push(c_outer);
        this.faces.push(new THREE.Face3(num, num+1, num+2))
      }
    } catch (err) {
      console.log(err)
    }
  }

}

export default Texture