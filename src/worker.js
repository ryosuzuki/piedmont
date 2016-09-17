import THREE from 'three'

import Geometry from './geometry'
import Texture from './texture'

onmessage = (event) => {
  let data = event.data
  let json = JSON.parse(data)
  console.log(json)

  let texture = new Texture()
  texture.text = json.text
  texture.hole = json.hole
  texture.load()
  texture.computeFaceNormals()
  texture.computeUniq()
  texture.computeVertexNormals()
  texture.computeFaceInfo()

  texture.svgPositions = json.svgPositions
  texture.selectIndex = json.selectIndex
  console.log(texture)
  texture.generate()

  // var h = 0.03
  // var ng = new THREE.Geometry()

  // debugger
  // ng = fugafuga(svgPositions)
  // postMessage({ ng: ng});
}





