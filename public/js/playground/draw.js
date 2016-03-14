var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  // side: THREE.DoubleSide,
  // wireframe: true,
})

var ng = new THREE.Geometry();
function drawObjects () {
  var size = 2;
  var r = 8;
  // var geometry = new THREE.BoxGeometry(size, size, size, r, r, r)
  var geometry = new THREE.CylinderGeometry(size, size, size, 30)
  mesh = new THREE.Mesh(geometry, material);
  mesh.geometry.verticesNeedUpdate = true;
  mesh.dynamic = true;
  scene.add(mesh);
}

function createSvg () {
  loadSvg('/public/assets/mickey-2.svg', function (err, svg) {
    // console.log(svg);
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
  // console.log(points.length)
  // points = points.map(function(p) { return [(p[0]+0.75)*200, (-p[1]+0.75)*200]})
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
  intersect = [];

  inner_points = [];
  outer_points = [];
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
      if (va.y < 1) continue;
      continue;
      var num = ng.vertices.length;
      ng.vertices.push(va)
      ng.vertices.push(vb)
      ng.vertices.push(vc)
      ng.faces.push(new THREE.Face3(num, num+1, num+2))
    } else {
      var test = greinerHormann.diff(triangle, positions)
      for (var ti=0; ti<test.length; ti++) {
        var points = test[ti]
        var outer_triangle = triangle.filter(function (t) {
          for (var pi=0; pi<points.length; pi++) {
            var p = points[pi];
            if (_.isEqual(p, t)) return true;
          }
          return false;
        })
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
          // ng.faces.push(new THREE.Face3(num+2, num+1, num))

          var inner_a = ng.vertices[num]
          var inner_b = ng.vertices[num+1]
          var inner_c = ng.vertices[num+2]

          var h = 0.2;
          var v = new THREE.Vector3();
          var normal = new THREE.Vector3(0, 0.2, 0)
          var outer_a = v.clone().addVectors(inner_a, normal)
          var outer_b = v.clone().addVectors(inner_b, normal)
          var outer_c = v.clone().addVectors(inner_c, normal)

          if (isNotTriangle(a, outer_triangle)) {
            inner_points.push(inner_a);
            outer_points.push(outer_a);
          }
          if (isNotTriangle(b, outer_triangle)) {
            inner_points.push(inner_b);
            outer_points.push(outer_b);
          }
          if (isNotTriangle(c, outer_triangle)) {
            inner_points.push(inner_c);
            outer_points.push(outer_c);
          }
        }
      }
      count++;
      // console.log(count);
    }
  }
  console.log('done')

  var n = inner_points.length;
  for (var i=0; i<n-1; i++) {
    var ci = inner_points[i];
    var ni = inner_points[i+1];
    var co = outer_points[i];
    var no = outer_points[i+1];

    var num = ng.vertices.length;
    ng.vertices.push(ci);
    ng.vertices.push(co);
    ng.vertices.push(ni);
    ng.faces.push(new THREE.Face3(num, num+1, num+2))

    var num = ng.vertices.length;
    ng.vertices.push(co);
    ng.vertices.push(no);
    ng.vertices.push(ni);
    ng.faces.push(new THREE.Face3(num, num+1, num+2))
  }

  scene.remove(mesh)
  nm = new THREE.Mesh(ng, material);
  nm.geometry.verticesNeedUpdate = true;
  nm.dynamic = true;
  nm.castShadow = true;
  nm.receiveShadow = true;
  scene.add(nm);
}

var checked = []
function isNotTriangle (v, outer_triangle) {
  var epsilon = Math.pow(10, -2);
  for (var j=0; j<outer_triangle.length; j++) {
    var t = outer_triangle[j];
    if (Math.abs(t[0]-v[0]) < epsilon && Math.abs(t[1]-v[1])< epsilon) {
      console.log(v, t)
      return false;
    }
  }
  if (checked.includes(v.toString())) return false;
  checked.push(v.toString())
  return true
}

function denestPolyline (nested) {
  var positions = []
  var edges = []

  for (var i = 0; i < nested.length; i++) {
    var path = nested[i]
    var loop = []
    for (var j = 0; j < path.length; j++) {
      var pos = path[j]
      var idx = positions.indexOf(pos)
      if (idx === -1) {
        positions.push(pos)
        idx = positions.length - 1
      }
      loop.push(idx)
    }
    edges.push(loop)
  }
  return {
    positions: positions,
    edges: edges
  }
}

function addFace (ng, og, fi) {
  var intersect = []
  var face = og.faces[fi];
  var a = og.vertices[face.a];
  var b = og.vertices[face.b];
  var c = og.vertices[face.c];
  var num = ng.vertices.length;
  if (a.z == 0) {
    intersect.push(num)
    a.z = size;
  }
  if (b.z == 0) {
    intersect.push(num+1)
    b.z = size;
  }
  if (c.z == 0) {
    intersect.push(num+2)
    c.z = size;
  }
  ng.vertices.push(a)
  ng.vertices.push(b)
  ng.vertices.push(c)
  ng.faces.push(new THREE.Face3(num, num+1, num+2))
  ng.faceVertexUvs.push()
  return { ng: ng, intersect: intersect };
}

function exportSTL () {
  var exporter = new THREE.STLExporter();
  var stlString = exporter.parse( scene );
  var blob = new Blob([stlString], {type: 'text/plain'});
  saveAs(blob, 'demo.stl');
}

/*
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

svg = getSVG(intersect[0])
m = svgMesh3d(svg, {
  scale: 10,
  simplify: 0.1,
  randomization: false
})
console.log(m)
positions = triangles.positions;


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
}

var path = paths[0];
var m = svgMesh3d(path, {
  scale: 10,
  simplify: 0.1,
  randomization: false
})
console.log(m)
positions = triangles.positions;
*/