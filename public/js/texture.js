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
    getNewUv(start)

  })
})

function getDgpc (start) {
  if (running) return false
  // if (_.size(origin_uvs) > 0) return false

  // if (origin_uvs[start] && origin_uvs[start].r < 0.1) return false
  running = true

  // console.log('start: ' + start)
  if (_.has(window.uvs, start)) {
    if (origin) {
      getNewUv(start)
    } else {
      updateMapping()
    }
    // updateMapping(start)
  } else {
    var size = geometry.uniq.length
    s = new Date().getTime();
    socket.emit('update-dgpc', size, start)
  }
}


var origin
function getNewUv (start) {
  window.new_uvs = {}
  window.updated_uvs = {}

  if (!origin) {
    origin = start
    window.origin_uvs = window.uvs[origin]
  } else {
    console.log('Start getNewUv ' + start)
    var current_uvs = uvs[start]
    var cid = start
    var eid
    for (var id in current_uvs) {
      if (current_uvs[id].theta == 0 && id != cid) eid = parseInt(id)
    }
    if (!origin_uvs[cid].u || !origin_uvs[cid].v || !origin_uvs[eid].u || !origin_uvs[cid].v) {
      console.log('fail')
      running = false
      return false
    } else {
      console.log(origin_uvs[cid])
      console.log(origin_uvs[eid])
    }



    var old_center = new THREE.Vector2(origin_uvs[cid].u, origin_uvs[cid].v)
    var old_edge = new THREE.Vector2(origin_uvs[eid].u, origin_uvs[eid].v)
    var old_axis = new THREE.Vector2(old_center.x + 0.01, old_center.y)


    var result = getSingedAngle(old_center, old_edge, old_axis)
    var sign = result.sign
    var old_angle = (sign > 0) ? result.angle : 2*Math.PI - result.angle

    for (var id in current_uvs) {
      var r = current_uvs[id].r
      var theta = current_uvs[id].theta - old_angle
      var u = r*Math.cos(theta) + old_center.x
      var v = r*Math.sin(theta) + old_center.y
      // if (isNaN(u) || isNaN(u)) continue
      new_uvs[id] = { u: u, v: v }
    }
    // uvs[cid] = new_uvs
  }
  var val = 0.5
  for (var id in origin_uvs) {
    var u = origin_uvs[id].u
    var v = origin_uvs[id].v
    if (Math.abs(u-0.5) < val && Math.abs(v-0.5) < val) {
      updated_uvs[id] = { u: u, v: v }
    }
  }
  for (var id in new_uvs) {
    if (!updated_uvs[id]) updated_uvs[id] = new_uvs[id]
  }
  updateMapping(updated_uvs)
}


// window.updated_uvs = {}
function updateMapping (uvs) {
  for (var id in uvs) {
    geometry.uniq[id].uv = uvs[id]
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
      g.faceVertexUvs[0][i] = [uv_a, uv_b, uv_c]
      geometry.faceVertexUvs[0][i] = [uv_a, uv_b, uv_c]
    }
  }
  // showDrawingCanvas()
  showCheckerMark()

  running = false
}

var checkerMark
function toggleMapping () {
  if (checkerMark) {
    showDrawingCanvas()
  } else {
    showCheckerMark()
  }
  checkerMark = !checkerMark
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


