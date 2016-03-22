var backgroundColor = '#FFFFFF'
var backgroundCanvas = document.createElement('canvas')
backgroundCanvas.width = 1
backgroundCanvas.height = 1
var viewingMaterial = new THREE.MeshFaceMaterial
var drawingCanvas;
// var drawingCanvas = document.createElement('canvas')

window.onload = function () {
  drawingCanvas = document.getElementById('drawing')
  drawingCanvas.width = renderer.domElement.width
  drawingCanvas.height = renderer.domElement.height
  paper.setup(drawingCanvas)

  paper.view.on('frame', onDocumentMouseDown)
  paper.view.onMouseDown = onDocumentMouseDown

  path = new paper.Path(pathStyle)

  window.drawLine = function (x, y) {
    var point = new paper.Point(x, y)
    // var point = new paper.Point(Math.random()*400, Math.random()*400)
    path.add(point);
    paper.view.draw()
  }

  window.finishPainting = function () {
    path.simplify(10)
    paper.view.draw()
    updateTexture()
    path = new paper.Path(pathStyle)
  }

  window.drawCircle = function () {
    var myCircle = new paper.Path.Circle(new paper.Point(100, 70), 50);
    myCircle.fillColor = 'red';
    paper.view.draw()
  }

}

function initializeViewingTexture () {
  // document.getElementById('drawing').appendChild(drawingCanvas)

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


function getScreenPosition (pos) {
  var vector = new THREE.Vector3();
  var canvas = renderer.domElement;
  vector.set(pos.x, pos.y, pos.z);
  mesh.updateMatrixWorld()
  vector.applyMatrix4( mesh.matrixWorld )
  vector.project( camera );
  vector.x = Math.round( (   vector.x + 1 ) * canvas.width  / 2 ),
  vector.y = Math.round( ( - vector.y + 1 ) * canvas.height / 2 );
  vector.z = 0;
  console.log(vector)
  return { x: vector.x, y: vector.y }
}

var affectedFaces = []
function updateTexture () {
  // affectedFaces = [currentIndex]
  // var uMax = Number.NEGATIVE_INFINITY
  // var uMin = Number.POSITIVE_INFINITY
  // var vMax = Number.NEGATIVE_INFINITY
  // var vMin = Number.POSITIVE_INFINITY
  for (var i=0; i<affectedFaces.length; i++) {
    var faceIndex = affectedFaces[i]
    var v1 = geometry.vertices[geometry.faces[faceIndex].a]
    var v2 = geometry.vertices[geometry.faces[faceIndex].b]
    var v3 = geometry.vertices[geometry.faces[faceIndex].c]
    var s1 = getScreenPosition(v1)
    var s2 = getScreenPosition(v2)
    var s3 = getScreenPosition(v3)

    // var drawingContext = drawingCanvas.getContext('2d')
    // drawingContext.beginPath()
    // drawingContext.moveTo(s1.x, s1.y)
    // drawingContext.lineTo(s2.x, s2.y)
    // drawingContext.lineTo(s3.x, s3.y)
    // drawingContext.clip()

    var xMax = _.max([s1.x, s2.x, s3.x])
    var xMin = _.min([s1.x, s2.x, s3.x])
    var yMax = _.max([s1.y, s2.y, s3.y])
    var yMin = _.min([s1.y, s2.y, s3.y])
    console.log({xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax})
    var width = 400 //xMax - xMin
    var height = 400 // yMax - yMin
    var patchCanvas = document.createElement('canvas')
    patchCanvas.width = width
    patchCanvas.height = height
    var patchContext = patchCanvas.getContext('2d')
    patchContext.drawImage(drawingCanvas, 0, 0, width, height, 0, 0, width, height)
    // patchContext.fillStyle = 'blue'
    // patchContext.fillRect(0, 0, width, height)
    document.getElementById('debug').appendChild(patchCanvas)

    // var context = backgroundCanvas.getContext('2d')
    // context.beginPath()
    // context.fillStyle = 'red'
    // context.fillRect(0, 0, 1, 1)
    var patchMaterial = new THREE.MeshLambertMaterial({
      map: new THREE.Texture(patchCanvas),
      transparent: true
    })
    patchMaterial.map.minFilter = THREE.LinearFilter
    patchMaterial.map.needsUpdate = true
    viewingMaterial.materials[faceIndex] = patchMaterial

    // var uvs = geometry.faceVertexUvs[0][faceIndex]
    // uMax = Math.max(uMax, uvs[0].x, uvs[1].x, uvs[2].x);
    // uMin = Math.min(uMin, uvs[0].x, uvs[1].x, uvs[2].x);
    // vMax = Math.max(vMax, uvs[0].y, uvs[1].y, uvs[2].y);
    // vMin = Math.min(vMin, uvs[0].y, uvs[1].y, uvs[2].y);
    // break;
  }

  mesh.material = viewingMaterial
  // mesh.geometry.uvsNeedUpdate = true


  // xMax = uMax * drawingCanvas.width
  // xMin = uMin * drawingCanvas.width
  // yMax = (1 - vMin) * drawingCanvas.height
  // yMin = (1 - vMax) * drawingCanvas.height
  // debugger

  // var drawingContext = drawingCanvas.getContext('2d')
  // drawingContext.beginPath()
  // drawingContext.rect(xMin, yMin, xMax, yMax)
  // drawingContext.clip()

  // var width = xMax - xMin
  // var height = yMax - yMin
  // var patchCanvas = document.createElement('canvas')
  // patchCanvas.width = width
  // patchCanvas.height = height
  // patchCanvas.getContext('2d').drawImage(drawingCanvas, xMin, yMin, width, height, 0, 0, width, height)

  // var patchMaterial = new THREE.MeshLambertMaterial({
  //   map: new THREE.Texture(drawingCanvas),
  //   transparent: true
  // })
  // patchMaterial.map.minFilter = THREE.LinearFilter
  // patchMaterial.map.needsUpdate = true

  // for (var i=0; i<affectedFaces.length; i++) {
  //   var faceIndex = affectedFaces[i]
  //   viewingMaterial.materials[faceIndex] = patchMaterial
  // }



}





