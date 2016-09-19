import THREE from 'three'

import Geometry from './geometry'
import BumpGeometry from './bump-geometry'
import HollowGeometry from './hollow-geometry'

import ThreeCSG from './three/three-csg'

onmessage = (event) => {
  let data = JSON.parse(event.data)
  self.createBumpGeometry(data)
  /*
  if (data.type === 'BUMP') {
    self.createBumpGeometry(data)
  } else {
    self.createHollowGeometry(data)
  }
  */
}

self.createHollowGeometry = function (data) {
  let hollowGeometry = new HollowGeometry()
  hollowGeometry.text = data.text
  hollowGeometry.items = data.items
  hollowGeometry.type = data.type
  hollowGeometry.pathData = data.pathData
  hollowGeometry.load()
  hollowGeometry.generate()

  postMessage({ ng: hollowGeometry.ng })
}

self.createBumpGeometry = function (data) {
  let bumpGeometry = new BumpGeometry()
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


