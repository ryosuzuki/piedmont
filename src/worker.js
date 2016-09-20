import THREE from 'three'

import Geometry from './geometry'
import BumpGeometry from './bump-geometry'
import HollowGeometry from './hollow-geometry'

import ThreeCSG from './three/three-csg'

onmessage = (event) => {
  let data = JSON.parse(event.data)
  if (data.action === 'bump') {
    self.createBumpGeometry(data)
  } else {
    self.createHollowGeometry(data)
  }
}

self.createHollowGeometry = function (data) {
  let hollowGeometry = new HollowGeometry()
  hollowGeometry.model = data.model
  hollowGeometry.text = data.text
  hollowGeometry.items = data.items
  hollowGeometry.type = data.type
  hollowGeometry.pathData = data.pathData
  hollowGeometry.position = data.position
  hollowGeometry.load()
  hollowGeometry.generate()

  postMessage({ ng: hollowGeometry.ng })
}

self.createBumpGeometry = function (data) {
  let bumpGeometry = new BumpGeometry()
  bumpGeometry.model = data.model
  bumpGeometry.text = data.text
  bumpGeometry.type = data.type
  bumpGeometry.svgMeshPositions = data.svgMeshPositions
  bumpGeometry.selectIndex = data.selectIndex
  bumpGeometry.load()
  bumpGeometry.computeFaceNormals()
  bumpGeometry.computeUniq()
  bumpGeometry.computeVertexNormals()
  bumpGeometry.computeFaceVertexNormals()
  bumpGeometry.generate()

  postMessage({ ng: bumpGeometry.ng })
}


