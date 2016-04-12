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
    var val = 0.1
    if (window.task == 5) val = 3.0
    if (window.task == 6) val = 2.0

    showSegmentation(val)
  })
})

function showSegmentation (val) {
  var val = _.mean(geometry.phiFaces) * val
  window.selectIndex = []
  for (var i=0; i<geometry.faces.length; i++) {
    var phi = geometry.phiFaces[i]
    if (phi < val) continue
    var faceIndex = i
    selectIndex.push(faceIndex)
  }
  showSelectIndex()
}


var selectIndex = []
function initialCheck() {
  if (window.selectIndex.includes(current.faceIndex)) {
    // if (debugging) console.log('Skip')
    return false
  }
  console.log('Start initialCheck')
  // window.selectIndex = check(0.003)
  window.selectIndex = check(0.3)
  if (window.task && window.task <= 3) {
    showSelectIndex()
  } else if (selectIndex.length < 5) {
    getMeshSegmentation()
  } else {
    showSelectIndex()
  }
  origin = undefined
  getDgpc(start)

}

var sm
function showSelectIndex () {
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
  g.computeFaceNormals()
  // var m = new THREE.MeshBasicMaterial({color: 0xeeeeee})
  // checkerMark = false
  var m = new THREE.MeshLambertMaterial({
    color: 0xdddddd,
    // color: 0x00ffff,
    map: image,
    transparent: true,
    opacity: 0.7
  });
  sm = new THREE.Mesh(g, m)
  sm.scale.set(mesh.scale.x, mesh.scale.y, mesh.scale.z)
  sm.position.set(mesh.position.x, mesh.position.y, mesh.position.z)
  sm.rotation.set(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z)
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
    // if (uv.r < 0.4 && distortions[i] > 0.1) {
    if (distortions[i] > 0.1) {
      p_edges.push(i)
      q_edges.push(start)
      g.vertices.push(geometry.uniq[i].vertex)
    }
  }
  // showPoints(g)
  var json = { size: size, p_edges: p_edges, q_edges: q_edges }
  socket.emit('update-harmonic', json)
}

function check (epsilon) {
  // if (selectIndex.includes(current.faceIndex)) return false

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

      var bool = false
      switch (window.task) {
        case 1:
          bool = Math.abs(cos_a-1) < epsilon
          break
        case 2:
          epsilon = 0.1
          bool = Math.abs(cos_a-1) < epsilon
              || Math.abs(cos_a-cos_b) < epsilon
              || Math.abs(cos_a-cos_c) < epsilon
          break
        case 3:
          epsilon = 0.01
          bool = Math.abs(cos_a-1) < epsilon
              || Math.abs(cos_a-cos_b) < epsilon
              || Math.abs(cos_a-cos_c) < epsilon
          break
        case 4:
          epsilon = 0.1
          bool = Math.abs(cos_a-1) < epsilon
              || Math.abs(cos_a-cos_b) < epsilon
              || Math.abs(cos_a-cos_c) < epsilon
          break
        default:
          bool = Math.abs(cos_a-1) < epsilon
              || Math.abs(cos_a-cos_b) < epsilon
              || Math.abs(cos_a-cos_c) < epsilon
      }
      if (bool) {
        if (!finished.includes(nextFaces[i])) {
          queue = _.union(queue, [nextFaces[i]])
        }
        selectIndex.push(nextFaces[i])
      }
    }
    selectIndex = _.uniq(selectIndex)
    finished.push(faceIndex)
  }
  return selectIndex
}

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

function showPoints (g) {
  // var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
  // // m.color.setHex(Math.random() * 0xffffff);
  // m.color.setHex(0xff00ff);
  // points = new THREE.Points(g, m);
  // scene.add(points)

  console.log('hoge')
  // debugger
  var sphereGeometry = new THREE.SphereGeometry(0.01*size, 32, 32 );
  var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xf5555, shading: THREE.FlatShading } );
  for (var i= 0; i<g.vertices.length; i++ ) {
    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.position.set(g.vertices[i].x, g.vertices[i].y, g.vertices[i].z)
    scene.add( sphere );
    // spheres.push( sphere );
  }


}
