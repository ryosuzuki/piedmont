
var selectMode = false;
var undoMode = false;

$(document).on('click', '#mapping', function (event) {
  console.log('mapping');
  Q.call(getBoundary(geometry))
  .then(getMapping(geometry))
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

function onDocumentMouseDown( event ) {
  var intersects = getIntersects(event);
  if (intersects.length < 1) return false;
  // if (!selectMode && !undoMode) return false;
  window.current = intersects[0];
  if (selectMode) {
    // drawLine(pos.x, pos.y)
    showDrawingCanvas(pos)
  } else {
    var ci = current.faceIndex
    if (ci !== window.currentIndex && current.face) {
      window.currentIndex = ci
      window.pos = new THREE.Vector2(event.pageX, event.pageY);
      var start = map[current.face.a]
      getDgpc(start)
    }

    // window.event = event
    // if (currentIndex) affectedFaces = _.union(affectedFaces, [currentIndex])
    // paper.view.onFrame = function (event) { }
  }


}

function onDocumentMouseUp (event) {

  var intersects = getIntersects(event);
  if (intersects.length < 1) return false;
  if (selectIndex.length > 0) {
    console.log('Select Done')
  }
}

function onDocumentMouseMove (event) {
  console.log('move')
  var intersects = getIntersects(event);
  if (intersects.length > 0) {
    var basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    changeMaterial(intersects, basicMaterial);
  }
}

function getIntersects (event) {
  event.preventDefault();
  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects(scene.children);
  return intersects
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );

  // drawingCanvas.width = renderer.domElement.width
  // drawingCanvas.height = renderer.domElement.height
}

function onDocumentTouchStart( event ) {
  event.preventDefault();
  event.clientX = event.touches[0].clientX;
  event.clientY = event.touches[0].clientY;
  onDocumentMouseDown( event );
}

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
  finishSelect();
}, 'keyup');


