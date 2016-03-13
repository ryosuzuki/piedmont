var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  // wireframe: true,
})

var ng = new THREE.Geometry();

function createSvg () {
  loadSvg('/public/assets/mickey-2.svg', function (err, svg) {
    var d = $('path', svg).attr('d');
    // var d = "M 120, 120 m -70, 0 a 70,70 0 1,0 150,0 a 70,70 0 1,0 -150,0";
    var m = svgMesh3d(d, {
      scale: 1,
      simplify: 0.001,
      randomization: false,
      normalize: true
    })

    var complex = reindex(unindex(m.positions, m.cells));
    var geometry = new createGeom(complex)
    geometry.vertices = geometry.vertices.map( function (vertex) {
      vertex.z = size*2;
      return vertex;
    })
    var mesh = new THREE.Mesh(geometry, material)
    mesh.scale.set(0.5, 0.5, 0.5)
    // scene.add(mesh);
    replaceObject(m);
  })
}

function drawSVG (points) {
  path = new paper.Path();
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
  // TODO: Combine these two code
  var points = points.map(function(p) { return [(p[0]+0.75)*200, (-p[1]+0.75)*200]})
  var path2 = new paper.Path();
  path2.strokeColor = 'black';
  for (var i=0; i<points.length; i++) {
    var point = points[i];
    var next = points[(i+1)%points.length];
    path2.moveTo(new Point(point[0], point[1]))
    path2.lineTo(new Point(next[0], next[1]))
  }
  path2.closed = true;
  paper.view.draw();
  return d;
}

function replaceObject (svgMesh) {
  var positions = svgMesh.positions;
  var geometry = mesh.geometry;
  var vertices = geometry.vertices;
  var faces = geometry.faces;
  positions = positions.map(function (p) {
    return [p[0] * 0.5, p[1] * 0.5]
  })
  window.positions = positions;
  paths = []
  var count = 0;
  intersect = []
  for (var i=0; i<faces.length; i++) {
    var face = faces[i];
    var va = vertices[face.a];
    var vb = vertices[face.b];
    var vc = vertices[face.c];
    var triangle = [
      [va.x, va.z],
      [vb.x, vb.z],
      [vc.x, vc.z]
    ]
    var points = polygonBoolean(triangle, positions, 'not')
    if (points.length > 1) {
      points = (points[0].length < points[1].length) ? points[0] : points[1]
    } else {
      points = points[0]
    }
    if (points.length <= 3 || va.y < 0) {
      var test = greinerHormann.intersection(positions, triangle)
      if (test && test.length < 3 && va.y > 0) {
        var area = areaPolygon(test[0])
        var triArea = areaPolygon(triangle)
        if (area/triArea > 0.5) continue;
        console.log(area/triArea)
      }
      // if (va.z < 1) continue;
      var num = ng.vertices.length;
      ng.vertices.push(va)
      ng.vertices.push(vb)
      ng.vertices.push(vc)
      ng.faces.push(new THREE.Face3(num, num+1, num+2))
    } else {
      var test = greinerHormann.diff(triangle, positions)
      for (var k=0; k<test.length; k++) {
        var points = test[k]
        var d = drawSVG(points);
        var bndMesh = svgMesh3d(d, {
          scale: 1,
          simplify: Math.pow(10, -3),
          customize: true,
        })
        var nuv = bndMesh.positions;
        var nf = bndMesh.cells;
        for (var j=0; j<nf.length; j++) {
          var num = ng.vertices.length;
          var a = nuv[nf[j][0]]
          var b = nuv[nf[j][1]]
          var c = nuv[nf[j][2]]
          ng.vertices.push(new THREE.Vector3(a[0], size, a[1]));
          ng.vertices.push(new THREE.Vector3(b[0], size, b[1]));
          ng.vertices.push(new THREE.Vector3(c[0], size, c[1]));
          ng.faces.push(new THREE.Face3(num+2, num+1, num))
        }
      }
      count++;
      console.log(count);
    }
  }
  console.log('done')

  scene.remove(mesh)
  nm = new THREE.Mesh(ng, material);
  nm.geometry.verticesNeedUpdate = true;
  nm.dynamic = true;
  nm.castShadow = true;
  nm.receiveShadow = true;
  scene.add(nm);
}
