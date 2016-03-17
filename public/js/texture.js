var points = [];
var faces = [];
var limit = 1.5;
var num = 100;

var texture;

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
  .then(getBoundary(textureGeometry))
  .then(getMapping(textureGeometry))

  return textureGeometry;
}

function getBoundary (geometry) {
  console.log('Start getBoundary');
  var uniq = geometry.uniq;
  var map = geometry.map;
  var edges = geometry.edges;
  var faces = geometry.faces;

  var id = _.random(0, uniq.length-1);
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

function getMapping (geometry) {
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

      geometry.faceVertexUvs[0] = []
      for (var i=0; i<faces.length; i++) {
        var face = faces[i];
        var a = uniq[tmap[face.a]];
        var b = uniq[tmap[face.b]];
        var c = uniq[tmap[face.c]];
        var uv = [
          new THREE.Vector2(a.uv.u, a.uv.v),
          new THREE.Vector2(b.uv.u, b.uv.v),
          new THREE.Vector2(c.uv.u, c.uv.v)
        ];
        geometry.faceVertexUvs[0].push(uv);
        // var index = face.original;
        // geometry.faceVertexUvs[0][index] = uv;
        geometry.uvsNeedUpdate = true;
      }
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
      var loader = new THREE.TextureLoader()
      var image = loader.load('/public/assets/checkerboard.jpg');
      image.needsUpdate = true;
      mesh.material = new THREE.MeshBasicMaterial({map: image})
      mesh.material.needsUpdate = true

      // debugger;

      /*
      var rot = mesh.rotation;
      var pos = mesh.position;
      var axis = new THREE.Vector3(0, 1, 0);
      var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
      var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
      var loader = new THREE.TextureLoader();
      var image = loader.load('/public/assets/checkerboard.jpg');
      image.minFilter = THREE.LinearFilter;
      image.needsUpdate = true;
      var textureMaterial = new THREE.MeshBasicMaterial({map: image});
      if (texture) scene.remove(texture);
      texture = new THREE.Mesh(geometry, textureMaterial);
      texture.castShadow = true;
      texture.receiveShadow = true;
      texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
      texture.castShadow = true;
      texture.receiveShadow = true;
      texture.position.set(pos.x, pos.y, pos.z);
      scene.add(texture);
      // var image = THREE.ImageUtils.loadTexture('/assets/checkerboard.jpg');
      // texture.material = new THREE.MeshBasicMaterial({map: image});
      */
    }
  });
}

