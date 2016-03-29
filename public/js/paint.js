

function initPlaneCanvas () {
  var geometry = new THREE.PlaneGeometry(0.3*size, 0.3*size, 10)
  var material = new THREE.MeshLambertMaterial({
    color: 0x00ffff,
    vertexColors: THREE.FaceColors,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  })
  planeCanvas = new THREE.Mesh(geometry, material)
  planeCanvas.geometry.verticesNeedUpdate = true
  planeCanvas.dynamic = true
  planeCanvas.castShadow = true
  planeCanvas.receiveShadow = true
  planeCanvas.position.set(Infinity, Infinity, Infinity)
  scene.add(planeCanvas)
}

function showPlaneCanvas (current) {
  var normal = current.face.normal
  var point = current.point
  var pos = point.clone().add(normal.clone().multiplyScalar(0.01))
  var axis = point.clone().add(normal)
  planeCanvas.position.set(pos.x, pos.y, pos.z)
  planeCanvas.lookAt(axis)

  /*
  var canvas = document.getElementById('original')
  planeCanvas.material.map = new THREE.Texture(canvas)
  planeCanvas.material.map.minFilter = THREE.LinearFilter
  planeCanvas.material.map.needsUpdate = true
  if (scene.children.includes(planeCanvas)) {
    // scene.remove(planeCanvas)
  } else {
    scene.add(planeCanvas);
  }
  */
}

function copyMickey (uv) {
  if (!dm) return false
  drawingPaper.activate()
  window.currentUv = uv
  window.nextMickey = mickey.clone()
  var center = convertUvToCanvas(uv)
  nextMickey.position = center
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true

  window.mickey = nextMickey
}

function pasteMickey (uv) {

}

function colorMickey (color) {
  if (!dm) return false
  if (!color) color = 'black'
  drawingPaper.activate()
  mickey.fillColor = color
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true
}

function repeatMickey () {
  drawingPaper.activate()

  var center = new THREE.Vector2(mickey.position.x, mickey.position.y)
  var next = new THREE.Vector2(nextMickey.position.x, nextMickey.position.y)

  var unit = new THREE.Vector2()
  unit.subVectors(next, center).normalize()
  var dist = next.distanceTo(center)

  var add_centers = []
  var sub_centers = []
  var i = 0
  while (i<10) {
    var new_center = new THREE.Vector2()
    var v = unit.clone().multiplyScalar(i*dist)
    new_center.addVectors(center, v)
    add_centers.push(new_center)
    i++
  }
  _.pullAll(add_centers, [center, next])

  var i = 0
  while (i<10) {
    var new_center = new THREE.Vector2()
    var v = unit.clone().multiplyScalar(-i*dist)
    new_center.addVectors(center, v)
    sub_centers.push(new_center)
    i++
  }
  _.pullAll(sub_centers, [center, next])

  window.mickeys = []
  var i = 0
  var interval = setInterval( function () {
    var center = add_centers[i]
    var path = mickey.clone()
    path.position = [center.x, center.y]
    window.mickeys.push(path)

    var center = sub_centers[i]
    var path = mickey.clone()
    path.position = [center.x, center.y]
    window.mickeys.push(path)

    drawingPaper.view.draw()
    dm.material.map.needsUpdate = true
    i++
    if (i >= centers.length) clearInterval(interval)
  }, 100)

  window.centers = _.union(add_centers, sub_centers)

}

function scaleMickey (scale) {
  if (!dm) return false
  window.scale *= scale
  window.mickeys.forEach( function (mickey) {
    mickey.scale(scale)
  })
  paper.view.draw()
  dm.material.map.needsUpdate = true
}

function rotateMickey (rotate) {
  if (!dm) return false
  // rotate *= -1
  drawingPaper.activate()
  window.rotate = rotate
  window.mickeys.forEach( function (mickey) {
    mickey.rotate(rotate)
  })
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true
}

function moveMickey (uv) {
  if (!dm) return false
  // if (!window.nextMickey) return false
  drawingPaper.activate()
  window.currentUv = uv
  var center = convertUvToCanvas(uv)
  // nextMickey.position = center
  mickey.position = center
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true
}

function repeatPattern () {
  if (!dm) return false
  drawingPaper.activate()
  window.centerPositions = []
  var center = mickey.position
  var num = 3
  for (var i=0; i<num; i++) {
    for (var j=0; j<num; j++) {
      var path = mickey.clone()
      path.position = [
        center.x-20+20*i,
        center.y-20+20*j
      ]
      window.mickeys.push(path)
    }
  }
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true
}

function convertUvToCanvas (uv) {
  var width = drawingPaper.view.viewSize.width
  var height = drawingPaper.view.viewSize.height
  return [ (uv.x-0.5)*width, (uv.y-0.5)*height ]
}

function convertCanvasToUv (center) {
  var width = drawingPaper.view.viewSize.width
  var height = drawingPaper.view.viewSize.height
  return [ (center.x/width)+0.5, (center.y/height)+0.5 ]
}
