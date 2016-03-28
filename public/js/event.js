
var selectMode = false;
var undoMode = false;

var copyMode = false
function onDocumentMouseDown( event ) {
  window.dragging = true
  var intersects = getIntersects(event);
  if (intersects.length < 1) return false
  // if (!selectMode && !undoMode) return false;
  window.current = intersects[0];
  window.currentIndex = current.faceIndex

  if (selectMode) {
    if (copyMode) {
      repeatMickey()
      copyMode = false
    } else {
      copyMickey(current.uv)
      copyMode = true
    }

  }

}

function onDocumentMouseUp (event) {
  window.dragging = false
  window.previous = undefined
  planeCanvas.material.map = undefined
  planeCanvas.material.needsUpdate = true

  var intersects = getIntersects(event);
  if (intersects.length < 1) return false;

  // if (selectIndex.length > 0) {
  //   console.log('Select Done')
  // }
}

var dragging
var previous
function onDocumentMouseMove (event) {
  var intersects = getIntersects(event);
  if (intersects.length < 1) {
    controls.enabled = true
    return false
  }

  window.current = intersects[0];
  window.currentIndex = current.faceIndex
  if (false && selectMode) {
    controls.enabled = false
    if (!dragging) return false
    if (!previous) window.previous = current

    var center2d = getScreenPosition(planeCanvas.position)
    var current2d = getScreenPosition(current.point)
    var previous2d = getScreenPosition(previous.point)

    var scaleMode = true
    var rotateMode = true
    if (scaleMode) {
      var cd = current2d.distanceTo(center2d)
      var pd = previous2d.distanceTo(center2d)
      var scale = cd / pd
      scaleMickey(scale)
      planeCanvas.material.map = scaleImage
    } else if (rotateMode) {
      var v = new THREE.Vector2()
      var cv = v.clone().subVectors(current2d, center2d).normalize()
      var pv = v.clone().subVectors(previous2d, center2d).normalize()
      var angle = Math.acos(cv.dot(pv))
      var sign = (current2d.x - center2d.x) * (previous2d.y - center2d.y) - (current2d.y - center2d.y) * (previous2d.x - center2d.x) > 0 ? 1 : -1
      planeCanvas.rotateZ(sign*angle)
      rotateMickey(sign*angle*90/Math.PI)
      planeCanvas.material.map = rotateImage
    } else {
      planeCanvas.material.map = undefined
    }
    planeCanvas.material.needsUpdate = true
    window.previous = current

    // drawLine(pos.x, pos.y)
    if (pos) showDrawingCanvas(pos)
  } else {
    window.pos = new THREE.Vector2(event.pageX, event.pageY)
    var start = map[current.face.a]
    window.start = start
    getDgpc(start)
    if (current.uv) moveMickey(current.uv)

    togglePlaneCanvas(current)
  }

  if (copyMode) {
    if (current.uv) moveMickey(current.uv)
  }


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


$(document).on('click', '#mapping', function (event) {
  console.log('mapping');
});

$(document).on('click', '#add', function (event) {
  console.log('add');
  addTexture()
});

$(document).on('click', '#export', function() {
  var exporter = new THREE.STLExporter();
  var stlString = exporter.parse( scene );
  var blob = new Blob([stlString], {type: 'text/plain'});
  saveAs(blob, 'demo.stl');
});

var pathStyle = {
  strokeColor: 'black',
  strokeWidth: 5,
  fullySelected: true
}
var draft;


Mousetrap.bind('command', function () {
  undoMode = false
  selectMode = !selectMode
  if (selectMode) {
    $('#mode').addClass('pink').text('Select Mode (Press ⌘)')
  } else {
    // finishPainting()
    $('#mode').removeClass('pink').text('View Mode (Press ⌘)')
  }
}, 'keyup')
// Mousetrap.bind('command', function () {
//   selectMode = false;
//   $('#mode').removeClass('pink').text('View Mode (⌘ + Mouse)')
//   finishSelect();
// }, 'keyup');
Mousetrap.bind('option', function () {
  undoMode = true;
  selectMode = false;
  $('#mode').addClass('brown').text('Undo Mode');
}, 'keydown');
Mousetrap.bind('option', function () {
  undoMode = false;
  $('#mode').removeClass('brown').text('View Mode (⌘ + Mouse)');
  // finishSelect();
}, 'keyup');


