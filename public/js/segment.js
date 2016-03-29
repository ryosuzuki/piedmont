$(function () {
  socket.on('res-update-harmonic', function (result) {
    var phi = result.phi
    geometry.phi = result.phi
    geometry.phiFaces = geometry.faces.map( function (face) {
      var a = geometry.phi[map[face.a]];
      var b = geometry.phi[map[face.b]];
      var c = geometry.phi[map[face.c]];
      return (a+b+c)/3;
    });
    showPhiFaces(_.mean(geometry.phiFaces))
  })
})



function getNextFaces (faceIndex) {
  var face = geometry.faces[faceIndex]
  var a = geometry.uniq[map[face.a]]
  var b = geometry.uniq[map[face.b]]
  var c = geometry.uniq[map[face.c]]

  var face_ab = _.pull(_.intersection(a.faces, b.faces), faceIndex)

  var face_bc = _.pull(_.intersection(b.faces, c.faces), faceIndex)
  var face_ca = _.pull(_.intersection(c.faces, a.faces), faceIndex)
  return _.union(face_ab, face_bc, face_ca)
}

function initialCheck() {
  check(0.003)
}

var sm
function check (epsilon) {
  var face = current.face
  var a = geometry.uniq[face.a]
  var b = geometry.uniq[face.b]
  var c = geometry.uniq[face.c]

  window.selectIndex = [current.faceIndex]
  var queue = [current.faceIndex]
  var finished = []
  while (queue.length > 0) {
    var faceIndex = queue.shift()
    var face = geometry.faces[faceIndex]
    var normal = face.normal
    var nextFaces = getNextFaces(faceIndex)
    var cos = nextFaces.map( function (index) {
      var nextFace = geometry.faces[index]
      return normal.dot(nextFace.normal)
    })
    for (var i=0; i<3; i++) {
      var cos_a = cos[i]
      var cos_b = cos[(i+1)%3]
      var cos_c = cos[(i+2)%3]
      if (Math.abs(cos_a-1) < epsilon
        || Math.abs(cos_a-cos_b) < epsilon
        || Math.abs(cos_a-cos_c) < epsilon
      ) {
        if (!finished.includes(nextFaces[i])) {
          queue = _.union(queue, [nextFaces[i]])
        }
        selectIndex.push(nextFaces[i])
      }
    }
    selectIndex = _.uniq(selectIndex)
    finished.push(faceIndex)
  }

  scene.remove(sm)
  var g = new THREE.Geometry()
  for (var i=0; i<selectIndex.length; i++) {
    var selectFace = geometry.faces[selectIndex[i]]
    var num = g.vertices.length
    g.vertices.push(geometry.vertices[selectFace.a])
    g.vertices.push(geometry.vertices[selectFace.b])
    g.vertices.push(geometry.vertices[selectFace.c])
    g.faces.push(new THREE.Face3(num, num+1, num+2))
  }
  var m = new THREE.MeshBasicMaterial({color: 0x00ffff})
  sm = new THREE.Mesh(g, m)
  scene.add(sm)
}






function getMeshSegmentation () {
  // if (!window.start) return false
  var start = window.start
  var size = geometry.uniq.length
  var p_edges = []
  var q_edges = []
  var distortions = _.map(geometry.uniq, 'distortion')
  var g = new THREE.Geometry();
  for (var i=0; i<geometry.uniq.length; i++) {
    var uv = geometry.uniq[i].uv
    if (uv.r < 0.4 && distortions[i] > 0.1) {
      p_edges.push(i)
      q_edges.push(start)
      g.vertices.push(geometry.uniq[i].vertex)
    }
  }
  showPoints(g)
  var json = { size: size, p_edges: p_edges, q_edges: q_edges }
  socket.emit('update-harmonic', json)
}

var pm
function showPhiFaces (val) {
  scene.remove(pm)
  pg = new THREE.Geometry()
  for (var i=0; i<geometry.faces.length; i++) {
    var phi = geometry.phiFaces[i]
    if (phi < val) continue
    var face = geometry.faces[i]
    var num = pg.vertices.length
    pg.vertices.push(geometry.vertices[face.a])
    pg.vertices.push(geometry.vertices[face.b])
    pg.vertices.push(geometry.vertices[face.c])
    pg.faces.push(new THREE.Face3(num, num+1, num+2))
  }
  pg.computeFaceNormals()
  var material = new THREE.MeshLambertMaterial({ color: 0x00ffff });
  pm = new THREE.Mesh(pg, material)
  scene.add(pm)
}

function showPoints (g) {
  var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
  m.color.setHex(Math.random() * 0xffffff);
  points = new THREE.Points(g, m);
  scene.add(points)
}
