
function selectFace () {
  if (!start) start = current.face.a;
  p = map[current.face.a];
  console.log('p: ' + p);
  q = map[current.face.b];
  console.log('q: ' + q);
  Q.fcall(computeHarmonicField(geometry))
  .then(computeSelect())
  .then(colorChange())
  .then(function () {
    p = undefined;
    q = undefined;
    console.log(current);
    current.object.geometry.colorsNeedUpdate = true;
  });

  Q.fcall(computeHarmonicField(geometry))
  p = 917
  498
  780
  q = 257
  153
  1298
  Q.fcall(getField(geometry, p, q))

  .then(computeSelect())
  .then(colorChange())
  .then(function () {
    p = undefined;
    q = undefined;
    console.log(current);
    current.object.geometry.colorsNeedUpdate = true;
  });
}

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

