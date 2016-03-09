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
  var geometry = new THREE.Geometry();
  for (var i=0; i<selectIndex.length; i++) {
    var index = selectIndex[i];
    var face = window.geometry.faces[index];
    var a = uniq[map[face.a]];
    var b = uniq[map[face.b]];
    var c = uniq[map[face.c]];
    var v1 = window.geometry.vertices[face.a];
    var v2 = window.geometry.vertices[face.b];
    var v3 = window.geometry.vertices[face.c];
    var g = new THREE.Geometry();
    g.vertices.push(v1);
    g.vertices.push(v2);
    g.vertices.push(v3);
    g.faces.push(new THREE.Face3(0, 1, 2));
    g.verticesNeedUpdate = true;
    var m = new THREE.Mesh(g)
    geometry.mergeMesh(m);
    // geometry.faceVertexUvs[0].push([
    //   new THREE.Vector2(a.uv.u, a.uv.v),
    //   new THREE.Vector2(b.uv.u, b.uv.v),
    //   new THREE.Vector2(c.uv.u, c.uv.v)
    // ]);
    // geometry.uvsNeedUpdate = true;
  }

  // window.texture = texture;

  Q.call(computeUniq(geometry))
  // .then(computeLaplacian(geometry))
  .then(getBoundary(geometry))
  .then(getMapping(geometry))

  return geometry;
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
      var map = geometry.map;
      var faces = geometry.faces;

      geometry.faceVertexUvs[0] = [];
      for (var i=0; i<faces.length; i++) {
        var face = faces[i];
        var a = uniq[map[face.a]];
        var b = uniq[map[face.b]];
        var c = uniq[map[face.c]];
        geometry.faceVertexUvs[0].push([
          new THREE.Vector2(a.uv.u, a.uv.v),
          new THREE.Vector2(b.uv.u, b.uv.v),
          new THREE.Vector2(c.uv.u, c.uv.v)
        ]);
        geometry.uvsNeedUpdate = true;
      }


      var rot = mesh.rotation;
      var pos = mesh.position;
      var axis = new THREE.Vector3(0, 1, 0);
      var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
      var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
      var loader = new THREE.TextureLoader();
      var image = loader.load('/public/assets/checkerboard.jpg');
      image.minFilter = THREE.LinearFilter;
      var material = new THREE.MeshBasicMaterial({map: image});
      texture = new THREE.Mesh(geometry, material);
      texture.castShadow = true;
      texture.receiveShadow = true;
      texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
      texture.castShadow = true;
      texture.receiveShadow = true;
      texture.position.set(pos.x, pos.y, pos.z);
      scene.add(texture);
      // var image = THREE.ImageUtils.loadTexture('/assets/checkerboard.jpg');
      // texture.material = new THREE.MeshBasicMaterial({map: image});
    }
  });
}

