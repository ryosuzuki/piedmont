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
    updateUv(start)

  })
})

function getDgpc (start) {
  if (running) return false
  // if (_.size(origin_uvs) > 0) return false

  // if (origin_uvs[start] && origin_uvs[start].r < 0.1) return false
  running = true

  // console.log('start: ' + start)
  if (_.has(window.uvs, start)) {
    updateUv(start)
  } else {
    var size = geometry.uniq.length
    s = new Date().getTime();
    socket.emit('update-dgpc', size, start)
  }
}


// window.adjusted_uvs = {}

window.updated_uvs = {}

function checkUv () {
  for (var i=0; i<selectIndex.length; i++) {
    var face = geometry.faces[selectIndex[i]]
    var start = map[face.a]
    getDgpc(start)
  }
}


var origin
function updateUv (start) {
  var val = 0.5
  try {
    if (!origin) {
      origin = start
      window.origin_uvs = window.uvs[origin]
      for (var id in origin_uvs) {
        var u = origin_uvs[id].u
        var v = origin_uvs[id].v
        if (Math.abs(u-0.5) < val && Math.abs(v-0.5) < val) {
          updated_uvs[id] = { u: u, v: v }
          // updated_uvs[id] = { u: (u-0.5)+0.5, v: (v-0.5)+0.5 }
        }
      }
    } else {
      console.log('Start getNewUv ' + start)
      var current_uvs = uvs[start]
      var cid = start
      var eid
      for (var id in current_uvs) {
        if (current_uvs[id].theta == 0 && id != cid) eid = parseInt(id)
      }
      var old_center = new THREE.Vector2(updated_uvs[cid].u, updated_uvs[cid].v)
      var old_edge = new THREE.Vector2(updated_uvs[eid].u, updated_uvs[eid].v)
      var old_axis = new THREE.Vector2(old_center.x + 0.01, old_center.y)

      var result = getSingedAngle(old_center, old_edge, old_axis)
      var sign = result.sign
      var old_angle = (sign > 0) ? result.angle : 2*Math.PI - result.angle

      for (var id in current_uvs) {
        var r = current_uvs[id].r
        var theta = current_uvs[id].theta - old_angle
        var u = current_uvs[id].u
        var v = current_uvs[id].v
        var updated_u = r*Math.cos(theta) + old_center.x
        var updated_v = r*Math.sin(theta) + old_center.y
        if (!updated_uvs[id] && Math.abs(u-0.5) < val && Math.abs(v-0.5) < val) {
            updated_uvs[id] = { u: updated_u, v: updated_v }
            // origin_uvs[id] = { u: updated_u, v: updated_v }
            // updated_uvs[id] = { u: 0.1*(updated_u-0.5)+0.5, v: 0.1*(updated_v-0.5)+0.5 }
            // origin_uvs[id] = { u: 0.1*(updated_u-0.5)+0.5, v: 0.1*(updated_v-0.5)+0.5 }
        }
      }
    }

    var max_u = _.max(_.map(updated_uvs, 'u'))
    var min_u = _.min(_.map(updated_uvs, 'u'))
    var length_u = max_u - min_u
    var max_v = _.max(_.map(updated_uvs, 'v'))
    var min_v = _.min(_.map(updated_uvs, 'v'))
    var length_v = max_v - min_v

    var length = _.max([length_u, length_v])

    window.scaled_uvs = {}

    cuv = current.uv ? current.uv : new THREE.Vector2(0.5, 0.5)
    for (var id in updated_uvs) {
      scaled_uvs[id] = {
        u: (updated_uvs[id].u-0.5)/length + 0.5,
        v: (updated_uvs[id].v-0.5)/length + 0.5
      }
    }

    if (length > 1) {
      // drawingPaper.view.scrollBy(256*(length-1), 256*(length_v-1))
    }

    drawingPaper.view.viewSize = [256*length, 256*length]
    // drawingPaper.view.viewSize = [256*length_u, 256*length_v]

    updateMapping(scaled_uvs)
    /*
    var finished = _.keys(uvs).map(function (a) { return parseInt(a) })
    var edges = _.pullAll(_.clone(geometry.uniq[start].edges), finished)
    edges.forEach( function (edge) {
      getDgpc(edge)
    })
    */
  } catch (err) {
    console.log('Fail: ' + err)
    running = false
  }
  // updateMapping(updated_uvs)
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
      g.faceVertexUvs[0].push([uv_a, uv_b, uv_c])
      geometry.faceVertexUvs[0][i] = [uv_a, uv_b, uv_c]
    }
  }

  if (checkerMark) {
    showCheckerMark()
  } else {
    showDrawingCanvas()
  }
  // showDrawingCanvas()


  running = false
}

var repeatMapping
function toggleRepeat () {
  if (!checkerMark) checkerMark = true
  repeatMapping = !repeatMapping
  if (repeatMapping) {
    updateMapping(updated_uvs)
  } else {
    updateMapping(origin_uvs)
  }
}


var checkerMark
function toggleMapping () {
  repeatMapping = false
  checkerMark = !checkerMark
  if (checkerMark) {
    showCheckerMark()
  } else {
    showDrawingCanvas()
  }
}

function showCheckerMark () {
  var m = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: image,
    transparent: true
  });
  if (repeatMapping) {
    image.wrapS = THREE.RepeatWrapping;
    image.wrapT = THREE.RepeatWrapping;
  }
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
  m.map.flipY = false
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


