

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
  window.originalMickey = window.mickey.clone()
  originalMickey.opacity = 1
  currentMickey.opacity = 1
  originalMickey.sendToBack()
  colorMickey(originalMickey)

  var center = convertUvToCanvas(uv)
  mickey.position = center
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true

  window.mickeys.push(mickey)
  window.currentMickey = mickey
}

function pasteMickey (uv) {

}

function colorMickey (mickey, color) {
  if (!dm) return false
  if (!color) color = 'grey'
  drawingPaper.activate()
  mickey.fillColor = color
  drawingPaper.view.draw()
  dm.material.map.needsUpdate = true
}

var centers = []
function repeatMickey () {
  drawingPaper.activate()

  var center = new THREE.Vector2(originalMickey.position.x, originalMickey.position.y)
  var next = new THREE.Vector2(mickey.position.x, mickey.position.y)

  var unit = new THREE.Vector2()
  unit.subVectors(next, center).normalize()
  var dist = next.distanceTo(center)

  var bound_width = mickey.bounds.width
  var bound_height = mickey.bounds.height

  var add_centers = []
  var sub_centers = []

  var width = drawingPaper.view.viewSize.width
  var height = drawingPaper.view.viewSize.height

  var currentMickeys = _.clone(mickeys)

  centers = _.union(centers, [center])

  for (var ci=0; ci<window.centers.length; ci++) {
    var current_center = window.centers[ci]

    var i = 0
    while (true) {
      var new_center = new THREE.Vector2()
      var v = unit.clone().multiplyScalar(i*dist)
      new_center.addVectors(current_center, v)

      if ( !new_center.equals(current_center)
        || !new_center.equals(center)
        || !new_center.equals(next)
      ) {
        var min_x = new_center.x - bound_width/2
        var max_x = new_center.x + bound_width/2
        var min_y = new_center.y - bound_height/2
        var max_y = new_center.y + bound_height/2
        if (Math.abs(min_x) > width/2) break
        if (Math.abs(max_x) > width/2) break
        if (Math.abs(min_y) > height/2) break
        if (Math.abs(max_y) > height/2) break
        add_centers.push(new_center)
      }
      i++
      if (i > 10) break
    }

    var i = 0
    while (true) {
      var new_center = new THREE.Vector2()
      var v = unit.clone().multiplyScalar(-i*dist)
      new_center.addVectors(current_center, v)

      if ( !new_center.equals(current_center)
        || !new_center.equals(center)
        || !new_center.equals(next)
      ) {
        var min_x = new_center.x - bound_width/2
        var max_x = new_center.x + bound_width/2
        var min_y = new_center.y - bound_height/2
        var max_y = new_center.y + bound_height/2
        if (Math.abs(min_x) > width/2) break
        if (Math.abs(max_x) > width/2) break
        if (Math.abs(min_y) > height/2) break
        if (Math.abs(max_y) > height/2) break
        sub_centers.push(new_center)
      }
      i++
      if (i > 10) break
    }

    window.add_centers = add_centers
    window.sub_centers = sub_centers

    window.mickeys = []
    var i = 0
    var interval = setInterval( function () {
      var center = add_centers[i]
      if (center) {
        var path = mickey.clone()
        path.position = [center.x, center.y]
        window.mickeys.push(path)
      }

      var center = sub_centers[i]
      if (center) {
        var path = mickey.clone()
        path.position = [center.x, center.y]
        window.mickeys.push(path)
      }

      drawingPaper.view.draw()
      dm.material.map.needsUpdate = true
      i++

      window.centers = _.union(add_centers, sub_centers)
      if (i >= centers.length) {
        // debugger
        clearInterval(interval)
        // originalMickey.opacity = 0
        // currentMickey.opacity = 0
      }
    }, 100)

  }

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
  window.currentMickey.position = center
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
  return [ (uv.x-0.5)*width, (uv.y-0.5)*height]
  // return [ (uv.x)*width, (uv.y)*height]
}

function convertCanvasToUv (center) {
  var width = drawingPaper.view.viewSize.width
  var height = drawingPaper.view.viewSize.height
  return [ (center.x/width)+0.5, (center.y/height)+0.5 ]
}
