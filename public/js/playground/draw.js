var objects = [];

var material = new THREE.MeshBasicMaterial({
  color: 0x00fffff,
  side: THREE.DoubleSide,
  wireframe: true
})

function drawObjects () {
  var size = 2;
  var geometry = new THREE.BoxGeometry(size, size, size)
  mesh = new THREE.Mesh(geometry, material);
  mesh.geometry.verticesNeedUpdate = true;
  mesh.dynamic = true;
  scene.add(mesh);


  var d = "M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0";
  svgMesh = svgMesh3d(d, {
    scale: 10,
    simplify: 0.1,
    randomization: false
  })
  var positions = svgMesh.positions;

  var vertices = geometry.vertices;
  var faces = geometry.faces;
  var sign = function (p1, p2, p3) {
    return (p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y);
  }
  var inTriangle = function (p, a, b, c) {
    var b1 = sign(p, a, b) < 0;
    var b2 = sign(p, b, c) < 0;
    var b3 = sign(p, c, a) < 0;
    return (b1 == b2) && (b2 == b3);
  }

  var getSVG = function (points) {
    var svg = '';
    for (var i=0; i<points.length-1; i++) {
      svg += "M"+points[i].x+","+points[i].y+" ";
      svg += "L"+points[i+1].x+","+points[i+1].y;
    }
    return svg;
  }

  var paths = []
  for (var i=0; i<faces.length; i++) {
    var face = faces[i];
    var a = vertices[face.a];
    var b = vertices[face.b];
    var c = vertices[face.c];
    var points = [a, b, c]
    if (a.z !== b.z || b.z !== c.z) continue;

    var internal
    for (var j=0; j<positions.length; j++) {
      var p = { x: positions[j][0], y: positions[j][1] };
      if internal == undefined
        // initial check
        internal = inTriangle(p, a, b, c);
      var nj = (j+1) % positions.length;
      var np = { x: positions[nj][0], y: positions[nj][1] };

      var line = { x0: p.x, x1: np.x, y0: p.y, y1: np.y }
      var ips = get_intersection(line, face)
      if (ips.length == 1)
        points.push(ips[0])
        internal = !internal
      else if (ips.length > 1)
        points.push(ips[0])
        points.push(ips[1])

      if internal
        points.push(np)

    }
    var svg = getSVG(points)
    paths.push(svg)
  }

  var path = paths[0];
  // var m = svgMesh3d(path, {
  //   scale: 10,
  //   simplify: 0.1,
  //   randomization: false
  // })
  // console.log(m)
  // positions = triangles.positions;


}






