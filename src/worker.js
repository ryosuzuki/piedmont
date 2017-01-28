import THREE from 'three'

import Geometry from './geometry'
import BumpGeometry from './bump-geometry'
import HollowGeometry from './hollow-geometry'
import HollowCsgGeometry from './hollow-csg-geometry'

import ThreeCSG from './three/three-csg'

onmessage = (event) => {
  let data = JSON.parse(event.data)
  if (data.action === 'bump') {
    self.createBumpGeometry(data)
  } else if (data.action === 'hollow') {
    self.createHollowGeometry(data)
  } else {
    self.createHollowCsgGeometry(data)
  }
}

self.createHollowCsgGeometry = function (data) {
  let hollowGeometry = new HollowCsgGeometry()
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

self.createHollowGeometry = function (data) {
  let hollowGeometry = new HollowGeometry()
  hollowGeometry.model = data.model
  hollowGeometry.text = data.text
  hollowGeometry.type = data.type
  hollowGeometry.svgMeshPositions = data.svgMeshPositions
  hollowGeometry.selectIndex = data.selectIndex
  hollowGeometry.load()
  hollowGeometry.computeFaceNormals()
  hollowGeometry.computeUniq()
  hollowGeometry.computeVertexNormals()
  hollowGeometry.computeFaceVertexNormals()
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


