var points = [];
var faces = [];
var limit = 1.5;
var num = 100;

var texture;

var mesh;

function getDgpc (start) {
  s = new Date().getTime();
  socket.emit('update', start)
}

window.onload = function () {
  paper.setup('drawing')
}

function showDrawingCanvas () {
  var width = 100
  var height = 100
  var canvas = document.getElementById('drawing')
  canvas.width = width
  canvas.height = height
  canvas.style.left = ( pos.x - width / 2 ) + 'px'
  canvas.style.top = ( pos.y - height / 2) + 'px'
  var context = canvas.getContext('2d')
  var center = new paper.Point(width/2, height/2)
  var circle = new paper.Path.Circle(center, 1)
  circle.fillColor = 'red';
  paper.view.draw()

  scene.remove(nm)
  var m = new THREE.MeshLambertMaterial({
    map: new THREE.Texture(canvas),
    transparent: true
  });
  m.map.minFilter = THREE.LinearFilter
  m.map.needsUpdate = true;
  nm = new THREE.Mesh(g, m);
  nm.scale.set(6, 6, 6)
  scene.add(nm);

}

$(function () {
  socket.on('res-update', function (data) {
    // console.log(data)
    var e = new Date().getTime();
    var time = e - s;
    // console.log('Execution time: ' + time + 'ms');
    updateMapping(data.uv)
  })
})

var nm
var g
function updateMapping (uvs) {
  scene.remove(nm)
  g = new THREE.Geometry()
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i]
    var a = geometry.uniq[map[face.a]]
    var b = geometry.uniq[map[face.b]]
    var c = geometry.uniq[map[face.c]]
    // if (uvs[a.id].r > 0.2 || uvs[b.id].r > 0.2 || uvs[c.id].r > 0.2 ) continue
    var num = g.vertices.length
    g.vertices.push(a.vertex)
    g.vertices.push(b.vertex)
    g.vertices.push(c.vertex)
    g.faces.push(new THREE.Face3(num, num+1, num+2))
    var uv_a = new THREE.Vector2(uvs[a.id].u, uvs[a.id].v)
    var uv_b = new THREE.Vector2(uvs[b.id].u, uvs[b.id].v)
    var uv_c = new THREE.Vector2(uvs[c.id].u, uvs[c.id].v)
    g.faceVertexUvs[0].push([uv_a, uv_b, uv_c])
  }
  showDrawingCanvas()

  // var m = new THREE.MeshLambertMaterial({
  //   color: 0xffffff,
  //   map: image,
  //   // transparent: true
  // });
  // nm = new THREE.Mesh(g, m);
  // nm.scale.set(6, 6, 6)
  // scene.add(nm);

  // initializeViewingTexture()
}




  // geometry.dynamic = true;
  // geometry.uvsNeedUpdate = true;
  // geometry.buffersNeedUpdate = true;
  // geometry.verticesNeedUpdate = true;
  // geometry.elementsNeedUpdate = true;
  // geometry.morphTargetsNeedUpdate = true;
  // geometry.uvsNeedUpdate = true;
  // geometry.normalsNeedUpdate = true;
  // geometry.colorsNeedUpdate = true;
  // geometry.tangentsNeedUpdate = true;
  // material.needsUpdate = true;

  // // mesh.material.color.setHex(Math.random() * 0xffffff);
  // // mesh.material.map = new THREE.TextureLoader().load('/bunny_1k.png')
  // var canvas = document.getElementById('canvas');
  // var image = new THREE.Texture(canvas)
  // image.needsUpdate = true;
  // mesh.material.color = 0xffffff;
  // mesh.material.map = image;
  // // mesh.material.map = image;
  //
  // geometry.faceVertexUvs = faceVertexUvs;
  // geometry.uvsNeedUpdate = true;
  // geometry.computeFaceNormals()
  // geometry.computeVertexNormals()
  // geometry.dynamic = true;
  // geometry.uvsNeedUpdate = true;


  // scene.remove(mesh);
  // mesh = new THREE.Mesh(geometry, material);
  // mesh.geometry.faceVertexUvs = faceVertexUvs;
  // mesh.geometry.uvsNeedUpdate = true;

  // mesh.material.needsUpdate = true;
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;



function addTexture () {
  createTexture();
  // Q.fcall(createTexture)
  // .then(computeUniq(geometry))

  // .then(computeLaplacian(geometry))
  // .then(getBoundary(geometry))
  // .then(getMapping(geometry))

}

function createTexture () {
  var textureGeometry = new THREE.Geometry();
  for (var i=0; i<selectIndex.length; i++) {
    var index = selectIndex[i];
    var face = geometry.faces[index];
    var v1 = geometry.vertices[face.a];
    var v2 = geometry.vertices[face.b];
    var v3 = geometry.vertices[face.c];
    var num = textureGeometry.vertices.length;
    textureGeometry.vertices.push(v1);
    textureGeometry.vertices.push(v2);
    textureGeometry.vertices.push(v3);
    var textureFace = new THREE.Face3(num, num+1, num+2);
    textureFace.map = [face.a, face.b, face.c];
    textureFace.original = index;
    textureFace.normal = face.normal;
    textureGeometry.faces.push(textureFace);
    textureGeometry.verticesNeedUpdate = true;
    // textureGeometry.faceVertexUvs[0].push([
    //   new THREE.Vector2(a.uv.u, a.uv.v),
    //   new THREE.Vector2(b.uv.u, b.uv.v),
    //   new THREE.Vector2(c.uv.u, c.uv.v)
    // ]);
    // textureGeometry.uvsNeedUpdate = true;
  }

  // window.texture = texture;

  Q.call(computeUniq(textureGeometry))
  // .then(computeLaplacian(textureGeometry))
  // .then(getBoundary(textureGeometry))
  .then(computeEdges(textureGeometry))
  .then(computeEdgeLength(textureGeometry))
  .then(computeAngle(textureGeometry))
  .then(computeBoundary(textureGeometry))
  .then(getMapping(textureGeometry))
  // .then(addLine(textureGeometry))
  return textureGeometry;
}

function getBoundary2 (geometry) {
  console.log('Start getBoundary');
  var uniq = geometry.uniq;
  var map = geometry.map;
  var edges = geometry.edges;
  var faces = geometry.faces;

  var sortUniq = _.sortBy(uniq, 'edges.length').filter( function (u) {
    return u.edges.length >= 2;
  });

  var id = sortUniq[0].id
  // sword: 1159;
  // bottom: 1814;
  // neck: 200;
  var checked = [];
  var current;
  while (true) {
    current = uniq[id];
    var remains = _.pullAll(current.edges, checked);
    if (remains.length <= 0) break;
    id = remains[0];
    checked = _.union(checked, [id]);
  }
  boundary = checked;
  geometry.boundary = boundary;
  console.log('Finish getBoundary')
  return geometry;
}

var line;
function addLine (texture) {
  var material = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 10
  });
  var geometry = new THREE.Geometry();
  for (var i=0; i<texture.geometry.boundary.length; i++) {
    var id = texture.geometry.boundary[i];
    var v = texture.geometry.uniq[id].vertex;
    geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
  };
  if (line) scene.remove(line)
  line = new THREE.Line(geometry, material);
  var rot = mesh.rotation;
  var pos = mesh.position;
  line.castShadow = true;
  line.receiveShadow = true;
  line.rotation.set(rot.x, rot.y, rot.z, rot.order)
  line.castShadow = true;
  line.receiveShadow = true;
  line.position.set(pos.x, pos.y, pos.z);
  scene.add(line);
}

function getMapping2 (geometry) {
  console.log('Start getMapping')
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map,
    boundary: geometry.boundary
  };
  $.ajax({
    url: '/get-mapping',
    type: 'POST',
    datatype: 'JSON',
    data: {
      json: JSON.stringify(json)
    },
    success: function (data) {
      console.log('Get result');
      console.log(data);

      geometry.uniq = data.uniq;
      // uniq = geometry.uniq;

      var uniq = geometry.uniq;
      var tmap = geometry.map;
      var faces = geometry.faces;

      geometry.computeBoundingBox();
      var max = geometry.boundingBox.max;
      var min = geometry.boundingBox.min;
      var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
      var range = new THREE.Vector2(max.x- min.x, max.y - min.y);

      geometry.faceVertexUvs[0] = []
      for (var i=0; i<faces.length; i++) {
        var face = faces[i];
        var a = uniq[tmap[face.a]];
        var b = uniq[tmap[face.b]];
        var c = uniq[tmap[face.c]];
        var uv = [
          new THREE.Vector2(
            (a.uv.u + offset.x) / range.x,
            (a.uv.v + offset.y) / range.y
          ),
          new THREE.Vector2(
            (b.uv.u + offset.x) / range.x,
            (b.uv.v + offset.y) / range.y
          ),
          new THREE.Vector2(
            (c.uv.u + offset.x) / range.x,
            (c.uv.v + offset.y) / range.y
          )
        ];
        geometry.faceVertexUvs[0].push(uv);
        // var index = face.original;
        // geometry.faceVertexUvs[0][index] = uv;
      }
      geometry.uvsNeedUpdate = true;
      geometry.buffersNeedUpdate = true;
      var rot = mesh.rotation;
      var pos = mesh.position;
      var axis = new THREE.Vector3(0, 1, 0);
      var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
      var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
      var loader = new THREE.TextureLoader();
      loader.load('/public/assets/checkerboard.jpg', function (image) {
        image.minFilter = THREE.LinearFilter;
        image.needsUpdate = true;
        // image.wrapS = THREE.RepeatWrapping;
        // image.wrapT = THREE.RepeatWrapping;
        // image.repeat.set(2, 2);
        // mesh.material.color = new THREE.Color('yellow')
        // mesh.material.map = image;
        // mesh.material.needsUpdate = true;
        if (texture) scene.remove(texture);
        var textureMaterial = new THREE.MeshBasicMaterial({map: image});
        texture = new THREE.Mesh(geometry, textureMaterial);
        texture.material.color = new THREE.Color('yellow')
        texture.material.map = image;
        texture.material.needsUpdate = true;
        texture.castShadow = true;
        texture.receiveShadow = true;
        texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
        texture.castShadow = true;
        texture.receiveShadow = true;
        texture.position.set(pos.x, pos.y, pos.z);
        scene.add(texture);

      });
      // var image = THREE.ImageUtils.loadTexture('/assets/checkerboard.jpg');
      // texture.material = new THREE.MeshBasicMaterial({map: image});
      // addLine(texture)
    }
  });
}


/*
function getDgpc2 (start) {
  console.log('Start getMapping')
  var s = new Date().getTime();

  var json = {
    // uniq: geometry.uniq,
    // faces: geometry.faces,
    // map: geometry.map,
    start: start
  };

  $.ajax({
    url: '/get-dgpc',
    type: 'POST',
    datatype: 'JSON',
    data: {
      json: JSON.stringify(json)
    },
    success: function (data) {
      console.log('Get result');
      console.log(data);
      window.data = data;




      // var loader = new THREE.TextureLoader();
      // loader.load('/bunny_1k.png', function (image) {
      //   image.minFilter = THREE.LinearFilter;
      //   image.needsUpdate = true;
      //   image.wrapS = THREE.RepeatWrapping;
      //   image.wrapT = THREE.RepeatWrapping;
      //   // image.repeat.set(4, 4);
      //   mesh.material = new THREE.MeshBasicMaterial({
      //     vertexColors: THREE.FaceColors,
      //     map: image
      //   });
      //   // mesh = new THREE.Mesh(geometry, material);
      //   // mesh.material.color = new THREE.Color('yellow')

      //   mesh.geometry.dynamic = true;
      //   mesh.geometry.uvsNeedUpdate = true;
      //   mesh.geometry.verticesNeedUpdate = true;
      //   mesh.geometry.elementsNeedUpdate = true;
      //   mesh.geometry.morphTargetsNeedUpdate = true;
      //   mesh.geometry.uvsNeedUpdate = true;
      //   mesh.geometry.normalsNeedUpdate = true;
      //   mesh.geometry.colorsNeedUpdate = true;
      //   mesh.geometry.tangentsNeedUpdate = true;
      //   mesh.material.needsUpdate = true;
      //   mesh.material.map.needsUpdate = true;
      //   mesh.material.map = image;
      //   mesh.material.needsUpdate = true;

      //   // mesh.castShadow = true;
      //   // mesh.receiveShadow = true;
      //   // mesh.castShadow = true;
      //   // mesh.receiveShadow = true;
      //   // mesh.scale.set(10, 10, 10)
      //   // scene.add(mesh);
      // });



      var e = new Date().getTime();
      var time = e - s;
      console.log('Execution time: ' + time + 'ms');

      // var loader = new THREE.TextureLoader();
      // loader.load('/bunny_1k.png', function (image) {
      //   image.minFilter = THREE.LinearFilter;
      //   image.needsUpdate = true;
      //   image.wrapS = THREE.RepeatWrapping;
      //   image.wrapT = THREE.RepeatWrapping;
      //   image.repeat.set(4, 4);
      //   var material = new THREE.MeshBasicMaterial({map: image});
      //   mesh = new THREE.Mesh(geometry, material);
      //   // mesh.material.color = new THREE.Color('yellow')
      //   mesh.material.map = image;
      //   mesh.material.needsUpdate = true;
      //   mesh.castShadow = true;
      //   mesh.receiveShadow = true;
      //   mesh.castShadow = true;
      //   mesh.receiveShadow = true;
      //   mesh.scale.set(10, 10, 10)
      //   scene.add(mesh);

      //   var g = new THREE.Geometry();
      //   g.vertices.push(geometry.uniq[start].vertex);
      //   var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
      //   m.color.setHex(Math.random() * 0xffffff);
      //   var p = new THREE.Points(g, m);
      //   p.scale.set(10, 10, 10)
      //   scene.add(p);

      // })
    }
  })
}
*/
