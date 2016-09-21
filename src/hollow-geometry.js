import THREE from 'three'
import _ from 'lodash'

import Geometry from './geometry'
import ThreeCSG from './three/three-csg'
import SvgToShape from './three/svg-to-shape'

class HollowGeometry extends Geometry {
  constructor () {
    super()

    this.type = 'HOLLOW' // 'BUMP'
    this.wallHeight = 0.1
    this.pathData = ''
    this.scale = 1/220
    this.material = new THREE.Material()
  }

  generate () {
    console.log(`Texture type is ${this.type}`)
    this.createItemMesh()

    this.mesh = new THREE.Mesh(this, this.material)
    // this.mesh.setY(-this.boundingBox.min.y)
    this.meshCSG = new ThreeCSG(this.mesh)
    this.itemMeshCSG = new ThreeCSG(this.items[0].mesh)
    for (let i=1; i<this.items.length; i++) {
      console.log('Start updating meshCSG')
      let itemMeshCSG = new ThreeCSG(this.items[i].mesh)
      this.itemMeshCSG = this.itemMeshCSG.union(itemMeshCSG)
    }

    if (this.type === 'BUMP') {
      console.log('Union the all CSG meshes')
      this.meshCSG = this.meshCSG.union(this.itemMeshCSG)
    } else {
      console.log('Subtract inner mesh')
      this.createInnerMesh()
      this.innerMeshCSG = new ThreeCSG(this.innerMesh)
      this.meshCSG = this.meshCSG.subtract(this.innerMeshCSG)
      console.log('Subtract item mesh')
      this.meshCSG = this.meshCSG.subtract(this.itemMeshCSG)
    }
    this.ng = this.meshCSG.toGeometry()
  }

  createItemMesh () {
    this.unit = SvgToShape.transform(this.pathData)

    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      let x = item.center.x //+ this.position.x
      let y = item.center.y //+ this.position.y
      let z = item.center.z //+ this.position.z
      let center = new THREE.Vector3(x, y, z)
      let normal = new THREE.Vector3(item.normal.x, item.normal.y, item.normal.z)
      let vec = new THREE.Vector3()
      let scalar = (this.type === 'HOLLOW') ? 20 : 7
      let start = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(-20*scalar)
      )
      let end = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(scalar)
      )
      let spline = new THREE.CatmullRomCurve3([start, end]);
      let extrudeSettings = { amount: 2, bevelEnabled: false, extrudePath: spline };
      let geometry = new THREE.ExtrudeGeometry(this.unit, extrudeSettings);
      geometry.normalize()
      let scale = 0.1
      if (this.model === 'house') {
        scale = 0.04 // this.size
      }
      if (this.model === 'cone') {
        scale = 0.3
      }
      if (this.model === 'speaker') {
        scale = 0.5
      }
      geometry.scale(scale, scale, scale)
      item.mesh = new THREE.Mesh(geometry, this.material)
      item.mesh.position.set(x, y, z)
      this.items[i] = item
    }
  }

  createInnerMesh () {
    this.innerMesh = this.mesh.clone()
    this.innerMesh.scale.set(1-this.wallHeight, 1-this.wallHeight, 1-this.wallHeight)
    let x = 0 //+ this.position.x
    let y = 0 // + this.position.y
    let z = this.wallHeight*1.5 //+ this.position.z
    this.innerMesh.position.set(x, y, z)
  }

}

export default HollowGeometry