
function scaleMickey (scale) {
  window.scale *= scale
  window.mickeys.forEach( function (mickey) {
    mickey.scale(scale)
  })
  paper.view.draw()
  dm.material.map.needsUpdate = true
}

function rotateMickey (rotate) {
  window.rotate = rotate
  window.mickeys.forEach( function (mickey) {
    mickey.rotate(rotate)
  })
  paper.view.draw()
  dm.material.map.needsUpdate = true
}

function moveMickey (uv) {
  window.currentUv = uv
  var center = convertUvToCenter(uv)
  mickey.position = center
  paper.view.draw()
  dm.material.map.needsUpdate = true
}

function repeatPattern () {
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
  paper.view.draw()
  dm.material.map.needsUpdate = true
}

var width = height = 256
function convertUvToCenter (uv) {
  return [ (uv.x-0.5)*width, -(uv.y-0.5)*height ]
}

function convertCenterToUv (center) {
  return [ (center.x/width)+0.5, -(center.y/height)+0.5 ]
}
