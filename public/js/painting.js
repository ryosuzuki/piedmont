var backgroundColor = '#FFFFFF'
var backgroundCanvas = document.createElement('canvas')
backgroundCanvas.width = 1
backgroundCanvas.height = 1
var viewingMaterial = new THREE.MeshFaceMaterial

function initializeViewingTexture () {
  var context = backgroundCanvas.getContext('2d')
  context.beginPath()
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, 1, 1)

  var backgroundMaterial = new THREE.MeshLambertMaterial({
    map: new THREE.Texture(backgroundCanvas),
    transparent: true
  })
  backgroundMaterial.map.needsUpdate = true;
  for (var i=0; i<geometry.faces.length; i++) {
    geometry.faces[i].materialIndex = i
    viewingMaterial.materials[i] = backgroundMaterial
  }

  mesh.material = viewingMaterial
  mesh.geometry.uvsNeedUpdate = true
}

function updateTexture () {
  var affectedFaces = [currentIndex]

  var width = 128
  var height = 128

  var drawingCanvas = document.createElement('canvas')
  drawingCanvas.width = width
  drawingCanvas.height = height
  var drawingContext = drawingCanvas.getContext('2d')
  drawingContext.beginPath()
  drawingContext.fillStyle = 'red'
  drawingContext.fillRect(0, 0, width, height)

  // var width = xMax - xMin
  // var height = yMax - yMin
  // var patchCanvas = document.createElement('canvas')
  // patchCanvas.width = width
  // patchCanvas.height = height
  // patchCanvas.getContext('2d').drawImage(drawingCanvas, xMin, yMin, 0, 0, width, height)

  var patchMaterial = new THREE.MeshLambertMaterial({
    map: new THREE.Texture(drawingCanvas),
    // transparent: true
  })
  patchMaterial.map.needsUpdate = true

  for (var i=0; i<affectedFaces.length; i++) {
    var faceIndex = affectedFaces[i]
    viewingMaterial.materials[faceIndex] = patchMaterial
  }



}





