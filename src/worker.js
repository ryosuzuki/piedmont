import THREE from 'three'

import Geometry from './geometry'
import Texture from './texture'

import ThreeCSG from './three/three-csg'

onmessage = (event) => {
  let data = event.data
  let json = JSON.parse(data)
  console.log(json)

  let texture = new Texture()
  texture.text = json.text
  texture.load()
  texture.computeFaceNormals()
  texture.computeUniq()
  texture.computeVertexNormals()
  texture.computeFaceVertexNormals()

  texture.enableCover = json.enableCover
  texture.svgMeshPositions = json.svgMeshPositions
  texture.selectIndex = json.selectIndex
  console.log(texture)
  texture.generate()

  postMessage({ ng: texture.ng })
}





