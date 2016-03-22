
var selectMode = false;
var undoMode = false;

$(document).on('click', '#mapping', function (event) {
  console.log('mapping');
  Q.call(getBoundary(geometry))
  .then(getMapping(geometry))
  // addTexture();
});

$(document).on('click', '#add', function (event) {
  console.log('add');
  addTexture()
  // var canvas = document.getElementById('canvas');
  // var image = new THREE.Texture(canvas)
  // image.needsUpdate = true;
  // texture.material.map = image;
  // addTexture();
});

$(document).on('click', '#export', function() {
  var exporter = new THREE.STLExporter();
  var stlString = exporter.parse( scene );
  var blob = new Blob([stlString], {type: 'text/plain'});
  saveAs(blob, 'demo.stl');
  /*
  generateVoxel( function (data) {
    var blob = new Blob([data], {type: 'text/plain'});
    saveAs(blob, 'demo.stl');
  })
  */
});

function saveGeometry () {
  $.ajax({
    url: '/save',
    method: 'POST',
    dataType: 'JSON',
    data: {
      json: geometry.uniq[0],
      // map: geometry.map
    },
    success: function (data) {
      console.log('done');
    }
  })
}

function generateVoxel (callback, client) {
  var geometry = texture.geometry;
  console.log('Start voxelization...')
  var cells = geometry.faces.map( function (face) {
    var map = geometry.map;
    return [map[face.a], map[face.b], map[face.c]];
  });
  var uniq = geometry.uniq;
  var positions = [];
  var mappings = [];
  for (var i=0; i<uniq.length; i++) {
    var object = uniq[i];
    var vertex = object.vertex;
    positions.push([vertex.x, vertex.y, vertex.z]);
    mappings.push([object.uv.u, object.uv.v]);
  }
  var json = {
    cells: cells,
    positions: positions,
    mappings: mappings,
    selected_cells: selectIndex,
    resolution: 0.02,
    uvMap: uvMap
  };
  if (client) {
    var object = voxelize(json);
    window.object = object;
    var data = normalSTL(object.voxels);
    console.log('done');
    if (callback) callback(data);
  } else {
    $.ajax({
      url: '/stl',
      method: 'POST',
      dataType: 'JSON',
      data: { json: JSON.stringify(json) },
      success: function (data) {
        console.log('done');
        if (callback) callback(data);
      }
    })
  }
}

function saveVoxel () {
  var cells = geometry.faces.map( function (face) {
    var map = geometry.map;
    return [map[face.a], map[face.b], map[face.c]];
  })
  var positions = geometry.uniq.map( function (object) {
    var vertex = object.vertex;
    return [vertex.x, vertex.y, vertex.z];
  })
  var json = { "cells": cells, "positions": positions };
}


function finishSelect () {
  if (selectIndex.length <= 0) return false;
  $('.bottom-buttons').show();
  // computeMapping();
}


var p;
var q;

var pathStyle = {
  strokeColor: 'black',
  strokeWidth: 5,
  fullySelected: true
}
var draft; // = new paper.Path(pathStyle);

var pathStyle = {
  strokeColor: 'red',
  strokeWidth: 10,
  // fullySelected: true
}

var path;
var start;


function onDocumentMouseDown( event ) {

  var intersects = getIntersects(event);
  if (intersects.length < 1) return false;
  if (!selectMode && !undoMode) return false;
  window.current = intersects[0];
  // window.currentIndex = current.faceIndex;
  // console.log('current: ' + current.uv.x + ' ' + current.uv.y);
  if (selectMode) {
    var ci = current.faceIndex
    if (ci !== window.currentIndex) {
      window.currentIndex = ci
      var start = map[current.face.a]
      getDgpc(start)
    }


    // var pos = new THREE.Vector2(event.pageX, event.pageY);
    // drawLine(pos.x, pos.y)

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


  // if (!start) start = current.face.a;
  // p = map[current.face.a];
  // console.log('p: ' + p);
  // q = map[current.face.b];
  // console.log('q: ' + q);
  // Q.fcall(computeHarmonicField(geometry))
  // .then(computeSelect())
  // .then(colorChange())
  // .then(function () {
  //   p = undefined;
  //   q = undefined;
  //   console.log(current);
  //   current.object.geometry.colorsNeedUpdate = true;
  // });

  // Q.fcall(computeHarmonicField(geometry))
  // p = 917
  // 498
  // 780
  // q = 257
  // 153
  // 1298
  // Q.fcall(getField(geometry, p, q))

  // .then(computeSelect())
  // .then(colorChange())
  // .then(function () {
  //   p = undefined;
  //   q = undefined;
  //   console.log(current);
  //   current.object.geometry.colorsNeedUpdate = true;
  // });
