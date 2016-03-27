var points = [];
var faces = [];
var limit = 1.5;
var num = 100;

var texture;
var mesh;
var dm
var g
var uvs = {}
var origin_uvs = {}

var running = false
$(function () {
  socket.on('res-update-dgpc', function (result) {
    var e = new Date().getTime();
    var time = e - s;
    // console.log('Execution time: ' + time + 'ms');
    var start = result.start
    window.uvs[start] = result.uv
    updateMapping(start)
  })
})

function getDgpc (start) {
  if (running) return false
  if (_.size(origin_uvs) > 0) return false

  // if (origin_uvs[start] && origin_uvs[start].r < 0.1) return false
  running = true

  console.log('start: ' + start)
  if (_.has(window.uvs, start)) {
    updateMapping(start)
  } else {
    var size = geometry.uniq.length
    s = new Date().getTime();
    socket.emit('update-dgpc', size, start)
  }
}

var origin
var updated_uvs = {}
function updateMapping (start) {
  var uvs
  origin = start
  window.origin_uvs = window.uvs[origin]
  var uvs = origin_uvs

  for (var id in origin_uvs) {
    geometry.uniq[id].uv = origin_uvs[id]
  }

  scene.remove(dm)
  g = new THREE.Geometry()
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i]
    var a = geometry.uniq[map[face.a]]
    var b = geometry.uniq[map[face.b]]
    var c = geometry.uniq[map[face.c]]
    // if (uvs[a.id].r > 0.2 || uvs[b.id].r > 0.2 || uvs[c.id].r > 0.2 ) continue
    if (uvs[a.id] && uvs[b.id] && uvs[c.id]) {
      var num = g.vertices.length
      g.vertices.push(a.vertex)
      g.vertices.push(b.vertex)
      g.vertices.push(c.vertex)
      g.faces.push(new THREE.Face3(num, num+1, num+2))
      var uv_a = new THREE.Vector2(uvs[a.id].u, uvs[a.id].v)
      var uv_b = new THREE.Vector2(uvs[b.id].u, uvs[b.id].v)
      var uv_c = new THREE.Vector2(uvs[c.id].u, uvs[c.id].v)
      g.faceVertexUvs[0].push([uv_a, uv_b, uv_c])

      geometry.faceVertexUvs[0][i] = [uv_a, uv_b, uv_c]
    }
  }

  showDrawingCanvas()
  // showCheckerMark()

  running = false
}

function showCheckerMark () {
  var m = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: image,
    transparent: true
  });
  m.map.minFilter = THREE.LinearFilter
  m.map.needsUpdate = true
  dm = new THREE.Mesh(g, m);
  dm.scale.set(mesh.scale.x, mesh.scale.y, mesh.scale.z)
  dm.position.set(mesh.position.x, mesh.position.y, mesh.position.z)
  scene.add(dm);
  // for (var id in origin_uvs) {
  //   var hash = origin_uvs[id]
  //   if (hash.theta == 0 && id !== origin) {
  //     ep = geometry.uniq[id]
  //   }
  // }
  // console.log(ep.id)
  // getDgpc(ep.id)
}

function showDrawingCanvas () {
  if (ng) return false
  scene.remove(dm)
  var canvas = document.getElementById('drawing')
  var m = new THREE.MeshLambertMaterial({
    map: new THREE.Texture(canvas),
    transparent: true
  });
  // m.map.magFilter = THREE.NearestFilter
  m.map.minFilter = THREE.LinearFilter
  // m.map.wrapS = THREE.RepeatWrapping;
  // m.map.wrapT = THREE.RepeatWrapping;
  // m.map.repeat.set(2, 2);
  m.map.needsUpdate = true
  dm = new THREE.Mesh(g, m)
  dm.scale.set(mesh.scale.x, mesh.scale.y, mesh.scale.z)
  dm.position.set(mesh.position.x, mesh.position.y, mesh.position.z)
  scene.add(dm);
}


