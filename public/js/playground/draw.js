var objects = [];

var material = new THREE.MeshBasicMaterial({
  color: 0x00fffff,
  side: THREE.DoubleSide,
  wireframe: true
})

var Point;
window.onload = function () {
}

function drawSVG () {
  console.log('ghoe')
  points = points[0].map(function (p) { return [(p[0]+1.5)*100, (p[1]+1.5)*100]})
  console.log(points);
  var path = new paper.Path();
  path.strokeColor = 'black';
  for (var i=0; i<points.length; i++) {
    var point = points[i];
    var next = points[(i+1)%points.length];
    path.moveTo(new Point(point[0], point[1]))
    path.lineTo(new Point(next[0], next[1]))
  }
  path.closed = true;
  paper.view.draw();

  var d = $(path.exportSVG()).attr('d')
  m = svgMesh3d(d, {
    scale: 10,
    simplify: 0.1,
    randomization: false
  })
  console.log(m)

  complex = reindex(unindex(m.positions, m.cells));
  var geometry = new createGeom(complex)
  var mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh);
}

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

  paths = []
  for (var i=0; i<faces.length; i++) {
    var face = faces[i];
    var a = vertices[face.a];
    var b = vertices[face.b];
    var c = vertices[face.c];
    if (a.z !== b.z || b.z !== c.z) continue;

    var triangle = [
      [a.x, a.y],
      [b.x, b.y],
      [c.x, c.y]
    ]
    points = polygonBoolean(triangle, positions, 'not')
    break;
  }



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
      svg += "M"+points[i][0]+","+points[i][1]+" ";
      svg += "L"+points[i+1][0]+","+points[i+1][1];
    }
    return svg;
  }

  var getIntersections = function (line1, line2) {
    var intersect = svgIntersections.intersect;
    var shape = svgIntersections.shape;

    var intersections = intersect(
      shape('line', line1),
      shape('line', line2)
    )
    return intersections.points

  }

  // svg = getSVG(intersect[0])
  // m = svgMesh3d(svg, {
  //   scale: 10,
  //   simplify: 0.1,
  //   randomization: false
  // })
  // console.log(m)
  // positions = triangles.positions;


    /*
    var abc = [a, b, c]
    var index = 0;
    var points = [abc[index]]
    var internal
    for (var j=0; j<positions.length; j++) {
      var p = { x: positions[j][0], y: positions[j][1] };
      if (internal == undefined)
        // initial check
        internal = inTriangle(p, a, b, c);
      var nj = (j+1) % positions.length;
      var np = { x: positions[nj][0], y: positions[nj][1] };

      var shape_line = { x1: p.x, y1: p.y, x2: np.x, y2: np.y };
      var face_line = { x1: abc[index].x, y1: abc[index].y, x2: abc[(index+1)%3].x, y2: abc[(index+1)%3].y };
      var ips = getIntersections(shape_line, face_line)
      console.log(ips)
      if (ips.length == 1) {
        points.push(ips[0])
        internal = !internal
        index++
        if (index > 3) {
          break;
        } else {
          points[abc[index]]
        }
      } else if (ips.length > 1) {
        points.push(ips[0])
        points.push(ips[1])
      }
      if (internal) {
        points.push(np)
      }
    }
    window.points = points;
    var svg = getSVG(points)
    paths.push(svg)
    console.log(points)
    break;
    */
  // }

  // var path = paths[0];
  // var m = svgMesh3d(path, {
  //   scale: 10,
  //   simplify: 0.1,
  //   randomization: false
  // })
  // console.log(m)
  // positions = triangles.positions;


}






