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
