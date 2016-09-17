import THREE from 'three'
import _ from 'lodash'
import GreinerHormann from 'greiner-hormann'
import SvgMesh3d from 'svg-mesh-3d'

import Geometry from './geometry'

class Texture extends Geometry {
  constructor () {
    super()

    this.enableHole = true
    this.wallHeight = 0.03
    this.boundaryPoints = []
    this.boundaryNormals = []
    this.boundary2d = []
    this.boundaryOuterPoints = []
    this.overlapIndex = []
  }

  generate () {
    this.ng = new Texture()

    for (let i=0; i<this.svgMeshPositions.length; i++) {
      let positions = this.svgMeshPositions[i]

      console.log(positions)
      this.boundaryPoints = new Array(positions.length)
      this.boundaryNormals = new Array(positions.length)
      this.boundary2d = new Array(positions.length)

      this.boundaryOuterPoints = new Array(positions.length)

      for (var i=0; i<this.selectIndex.length; i++) {
        const index = this.selectIndex[i]
        const face = this.faces[index]
        const res = face.compute(positions)
        if (!res) continue
      }

      if (!this.hole) {
        this.createWall()
        this.createCover()
      }
    }

    return false
    for (var i=0; i<this.faces.length; i++) {
      const index = i
      if (this.hole && this.overlapIndex.includes(index)) continue
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

  createWall () {
    console.log('Create wall')
    for (let i=0; i<this.boundaryPoints.length; i++) {
      let inner = this.boundaryPoints[i]
      if (!inner) continue
      let normal = this.boundaryNormals[i]
      let v = new THREE.Vector3();
      let wallNormal = normal.clone().multiplyScalar(this.wallHeight);
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
      // customize: true,
    })
    var cells = boundaryMesh.cells

    for (var i=0; i<cells.length; i++) {
      var outerPointA = this.outerPoints[cells[i][0]]
      var outerPointB = this.outerPoints[cells[i][1]]
      var outerPointC = this.outerPoints[cells[i][2]]
      var num = this.ng.vertices.length;
      this.ng.vertices.push(outerPointA);
      this.ng.vertices.push(outerPointB);
      this.ng.vertices.push(outerPointC);
      this.ng.faces.push(new THREE.Face3(num, num+1, num+2))
    }
  }

}

export default Texture