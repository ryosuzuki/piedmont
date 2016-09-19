import THREE from 'three'
import _ from 'lodash'

import Geometry from './geometry'
import ThreeCSG from './three/three-csg'
import SvgToShape from './three/svg-to-shape'

class HollowGeometry extends Geometry {
  constructor () {
    super()

    this.type = 'HOLLOW' // 'BUMP'
    this.wallHeight = 0.2
    this.pathData = ''
    this.scale = 1/220
    this.material = new THREE.Material()
  }

  generate () {
    console.log(`Texture type is ${this.type}`)
    this.createPreMesh()
    this.createItemMesh()
    this.outerMeshCSG = new ThreeCSG(this.outerMesh)
    this.innerMeshCSG = new ThreeCSG(this.innerMesh)
    console.log('Start creating meshCSG')
    if (this.type === 'BUMP') {
      this.meshCSG = this.outerMeshCSG
      this.itemMeshCSG = new ThreeCSG(this.items[0].mesh)
      for (let i=1; i<this.items.length; i++) {
        console.log('Start updating meshCSG')
        let itemMeshCSG = new ThreeCSG(this.items[i].mesh)
        this.itemMeshCSG = this.itemMeshCSG.union(itemMeshCSG)
      }
      console.log('Start subtracting meshCSG')
      this.meshCSG = this.meshCSG.union(this.itemMeshCSG)
    } else {
      this.meshCSG = this.outerMeshCSG.subtract(this.innerMeshCSG)
      this.itemMeshCSG = new ThreeCSG(this.items[0].mesh)
      for (let i=1; i<this.items.length; i++) {
        console.log('Start updating meshCSG')
        let itemMeshCSG = new ThreeCSG(this.items[i].mesh)
        this.itemMeshCSG = this.itemMeshCSG.union(itemMeshCSG)
      }
      console.log('Start subtracting meshCSG')
      this.meshCSG = this.meshCSG.subtract(this.itemMeshCSG)
    }
    this.ng = this.meshCSG.toGeometry()
  }

  createItemMesh () {
    this.unit = SvgToShape.transform(this.pathData)
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      let center = item.center
      let normal = item.normal
      let vec = new THREE.Vector3()
      item.center = new THREE.Vector3(center.x, center.y, center.z)
      item.normal = new THREE.Vector3(normal.x, normal.y, normal.z)
      let start = vec.clone().addVectors(
        item.center,
        item.normal.clone().multiplyScalar(-this.wallHeight)
      )
      let end = vec.clone().addVectors(
        item.center,
        item.normal.clone().multiplyScalar(this.wallHeight/this.scale)
      )
      let spline = new THREE.CatmullRomCurve3([start, end]);
      let extrudeSettings = { bevelEnabled: false, extrudePath: spline};
      let geometry = new THREE.ExtrudeGeometry(this.unit, extrudeSettings);
      item.mesh = new THREE.Mesh(geometry, this.material);
      item.mesh.scale.set(this.scale, this.scale, this.scale)
      item.mesh.position.set(start.x, start.y, start.z)
      item.mesh.rotateOnAxis(item.normal, 3*Math.PI/2)
      this.items[i] = item
    }
  }

  createPreMesh () {
    this.outerMesh = new THREE.Mesh(this, this.material)
    this.innerMesh = new THREE.Mesh(this, this.material)
    this.innerMesh.scale.set(1-this.wallHeight, 1-this.wallHeight, 1-this.wallHeight)
    this.innerMesh.position.set(0, this.wallHeight, 0)
  }

}

export default HollowGeometry