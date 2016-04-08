
var selectMode = false;
var undoMode = false;

var copyMode = false
var moveMode = false
var scaleMode = false
var rotateMode = false
var controlMode = false
var insideMode = false

var dragging
var previous
var current


var debugging = true
function onDocumentMouseDown( event ) {
  var intersects = getIntersects(event);
  if (intersects.length < 1) return false
  // if (!selectMode && !undoMode) return false;
  window.current = intersects[0];
  window.currentIndex = current.faceIndex

  if (finishSubtract) return false

  if (window.debugging && current) {
    window.pos = new THREE.Vector2(event.pageX, event.pageY)
    var start = map[current.face.a]
    window.start = start

    // initialCheck()
    // Q.fcall(initialCheck())
    // .then(getDgpc(start))
  }

  if (controlMode) {
    var pos = convertUvToCanvas(current.uv)
    pos = new paper.Point(pos[0], pos[1])
    if (pos.isInside(mickey.bounds)) {
      scaleMode = true
    } else {
      rotateMode = true
    }
  }

  if (!controlMode && current.uv) {
    var pos = convertUvToCanvas(current.uv)
    pos = new paper.Point(pos[0], pos[1])
    if (pos.isInside(mickey.bounds)) {
      moveMode = true
      controls.enabled = false
    }
  }

  // if (selectMode) {
  //   if (copyMode) {
  //     repeatMickey()
  //     copyMode = false
  //   } else {
  //     copyMickey(current.uv)
  //     copyMode = true
  //   }

  // }

}

function onDocumentMouseUp (event) {
  // window.dragging = false
  previous = undefined
  scaleMode = false
  rotateMode = false
  if (!controlMode) {
    controls.enabled = true
  }

  if (finishSubtract) return false

  if (mesh) mesh.material.color = new THREE.Color('white')

  var intersects = getIntersects(event);

  if (window.dragging && intersects.length > 0) {
    window.pos = new THREE.Vector2(event.pageX, event.pageY)
    var start = map[current.face.a]
    window.start = start

    initialCheck()

    getDgpc(start)
    if (current.uv) moveMickey(current.uv)
  }

  window.moveMode = false
  window.dragging = false
  if (intersects.length < 1) return false;

  // if (selectIndex.length > 0) {
  //   console.log('Select Done')
  // }
}


function onDocumentDoubleClick (event) {
  if (finishSubtract) return false

  if (controlMode) {
    controlMode = false
    planeCanvas.position.set(Infinity, Infinity, Infinity)
  } else {
    if (current.uv) {
      var pos = convertUvToCanvas(current.uv)
      pos = new paper.Point(pos[0], pos[1])
      if (pos.isInside(mickey.bounds)) {
        console.log('hoge')
        showPlaneCanvas(current)
        planeCanvas.material.map = scaleImage
        planeCanvas.material.needsUpdate = true
        controlMode = true
        controls.enabled = false
      }
    }
  }
}

window.sorted_centers_x = _.map(_.sortBy(centers, 'x'), 'x')

function getClosestMickey (pos) {
  window
}

function onDocumentMouseMove (event) {
  var intersects = getIntersects(event)
  if (intersects.length < 1) return false
  window.current = intersects[0]


  if (finishSubtract) return false

  if (window.dragging && intersects.length > 0) {
    if (mesh) mesh.material.color = new THREE.Color('gray')
  } else {
    if (mesh) mesh.material.color = new THREE.Color('white')
  }

  if (controlMode && current.uv) {
    var pos = convertUvToCanvas(current.uv)
    pos = new paper.Point(pos[0], pos[1])
    if (pos.isInside(window.mickey.bounds)) {
      planeCanvas.material.map = scaleImage
      planeCanvas.material.needsUpdate = true
    } else {
      planeCanvas.material.map = rotateImage
      planeCanvas.material.needsUpdate = true
    }

    if (scaleMode) {
      scaleModeControl()
    }
    if (rotateMode) {
      rotateModeControl()
    }
  }

  if (current && current.uv) {
    var pos = convertUvToCanvas(current.uv)
    pos = new paper.Point(pos[0], pos[1])

    if (!copyMode) {
      var hover = false

      for (var i=0; i<mickeys.length; i++) {
        var mickey = mickeys[i]
        if (pos.isInside(mickey.bounds)) {
          hover = true
          window.mickey = mickey
          window.currentMickey = mickey
          colorMickey(mickey, new paper.Color(1, .5, .5))
        } else {
          colorMickey(mickey)
        }
      }
      if (hover) {
        insideMode = true
      } else {
        insideMode = false
      }

      // if (pos.isInside(mickey.bounds)) {
      // if (hover) {
      // } else {
      // }
    }
    if (moveMode || copyMode) {
      moveMickey(current.uv)
      window.start = map[current.face.a]
      initialCheck()
      getDgpc(start)
    }
    // if (copyMode) {
    //   moveMickey(current.uv, 'copy')
    // }
  } else {
    insideMode = false
  }

  if (intersects.length < 1) {
    // controls.enabled = true
    return false
  }

  window.current = intersects[0];
  window.currentIndex = current.faceIndex




  if (false && selectMode) {

  } else {
    // window.pos = new THREE.Vector2(event.pageX, event.pageY)
    // var start = map[current.face.a]
    // window.start = start
    // getDgpc(start)
    // if (current.uv) moveMickey(current.uv)

    // togglePlaneCanvas(current)
  }

  // if (copyMode) {
  //   if (current.uv) moveMickey(current.uv)
  // }


}

function scaleModeControl () {
  if (!previous) window.previous = current
  var center2d = getScreenPosition(planeCanvas.position)
  var current2d = getScreenPosition(current.point)
  var previous2d = getScreenPosition(previous.point)

  var cd = current2d.distanceTo(center2d)
  var pd = previous2d.distanceTo(center2d)
  var scale = cd / pd
  scaleMickey(scale)
  window.previous = current
  // drawLine(pos.x, pos.y)
  // if (pos) showDrawingCanvas(pos)
}

function rotateModeControl () {
  if (!previous) window.previous = current
  var center2d = getScreenPosition(planeCanvas.position)
  var current2d = getScreenPosition(current.point)
  var previous2d = getScreenPosition(previous.point)
  var v = new THREE.Vector2()
  var cv = v.clone().subVectors(current2d, center2d).normalize()
  var pv = v.clone().subVectors(previous2d, center2d).normalize()
  var angle = Math.acos(cv.dot(pv))
  var sign = (current2d.x - center2d.x) * (previous2d.y - center2d.y) - (current2d.y - center2d.y) * (previous2d.x - center2d.x) > 0 ? 1 : -1
  planeCanvas.rotateZ(sign*angle)
  rotateMickey(sign*angle*90/Math.PI)
  planeCanvas.material.map = rotateImage

  var result = getSingedAngle(center2d, current2d, previous2d)
  var sign = result.sign
  var angle = result.angle
  planeCanvas.rotateZ(sign*angle)
  rotateMickey(sign*angle*90/Math.PI)
  planeCanvas.material.map = rotateImage
  window.previous = current
}


function getSingedAngle (center, point, axis) {
  var v = new THREE.Vector2()
  var cp = v.clone().subVectors(point, center).normalize()
  var ca = v.clone().subVectors(axis, center).normalize()
  var angle = Math.acos(cp.dot(ca))
  var sign = (point.x - center.x) * (axis.y - center.y) - (point.y - center.y) * (axis.x - center.x) > 0 ? 1 : -1
  var result = { sign: sign, angle: angle }
  return result
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
  // console.log(vector)
  var screenPos = new THREE.Vector2(vector.x, vector.y)
  return screenPos
}



function getIntersects (event) {
  event.preventDefault();
  try {
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects(objects);
    return intersects
  } catch (err) {
    return []
  }
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentTouchStart( event ) {
  event.preventDefault();
  event.clientX = event.touches[0].clientX;
  event.clientY = event.touches[0].clientY;
  onDocumentMouseDown( event );
}

function exportStl () {
  var exporter = new THREE.STLExporter();
  var stlString
  if (scene.children.includes(nm)) {
    stlString = exporter.parse(nm)
  } else {
    stlString = exporter.parse(mesh)
  }
  var blob = new Blob([stlString], {type: 'text/plain'});
  saveAs(blob, 'demo.stl');
}

var pathStyle = {
  strokeColor: 'black',
  strokeWidth: 5,
  fullySelected: true
}
var draft;

Mousetrap.bind('command+c', function (event) {
  if (insideMode && current && current.uv) {
    copyMode = true
    copyMickey(current.uv)
    $('#mode').addClass('pink').text('Copy Mode (Press ⌘)')
  }
}, 'keydown')

Mousetrap.bind('command+v', function (event) {
  if (copyMode && current && current.uv) pasteMickey(current.uv)
  copyMode = false
  $('#mode').removeClass('pink').text('View Mode (Press ⌘)')
}, 'keydown')


// Mousetrap.bind('command', function () {
//   undoMode = false
//   selectMode = !selectMode
//   if (selectMode) {
//     $('#mode').addClass('pink').text('Select Mode (Press ⌘)')
//   } else {
//     // finishPainting()
//     $('#mode').removeClass('pink').text('View Mode (Press ⌘)')
//   }
// }, 'keyup')
// // Mousetrap.bind('command', function () {
// //   selectMode = false;
// //   $('#mode').removeClass('pink').text('View Mode (⌘ + Mouse)')
// //   finishSelect();
// // }, 'keyup');
// Mousetrap.bind('option', function () {
//   undoMode = true;
//   selectMode = false;
//   $('#mode').addClass('brown').text('Undo Mode');
// }, 'keydown');
// Mousetrap.bind('option', function () {
//   undoMode = false;
//   $('#mode').removeClass('brown').text('View Mode (⌘ + Mouse)');
//   // finishSelect();
// }, 'keyup');


