var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  wireframe: true,
})
material.color.set(new THREE.Color('blue'))

var ng;

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
    path.moveTo(new paper.Point(point[0], point[1]))
    path.lineTo(new paper.Point(next[0], next[1]))
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
    path2.moveTo(new paper.Point(point[0], point[1]))
    path2.lineTo(new paper.Point(next[0], next[1]))
  }
  path2.closed = true;
  paper.view.draw();
  return d;
}

function go () {
  Q.fcall(computeUniq(g))
  .then(replaceObject(svg, g))
}

function replaceObject (svgMesh, geometry) {
  if (ng) scene.remove(ng);
  geometry.computeFaceNormals()

  ng = new THREE.Geometry();
  for (var i=0; i<geometry.faces.length; i++) {
    if (selectIndex.includes(i)) continue;
    var face = geometry.faces[i];
    var normal = face.normal;
    var va  = geometry.vertices[face.a];
    var vb  = geometry.vertices[face.b];
    var vc  = geometry.vertices[face.c];
    var num = ng.vertices.length;
    ng.vertices.push(va);
    ng.vertices.push(vb);
    ng.vertices.push(vc);
    // ng.faces.push(new THREE.Face3(num, num+1, num+2))

    var h = -0.01;
    var v = new THREE.Vector3();
    var h_normal = normal.clone().multiplyScalar(h);
    var outer_a = v.clone().addVectors(va, h_normal)
    var outer_b = v.clone().addVectors(vb, h_normal)
    var outer_c = v.clone().addVectors(vc, h_normal)
    var num = ng.vertices.length;
    ng.vertices.push(outer_a)
    ng.vertices.push(outer_b)
    ng.vertices.push(outer_c)
    // ng.faces.push(new THREE.Face3(num, num+1, num+2))
    // ng.faces.push(new THREE.Face3(num+2, num+1, num+1))
  }

  var positions = svgMesh.positions;

  // Centerize positions around [0, 1]
  positions = positions.map(function (p) {
    return [
      ( p[0] * 0.5 * 200 / 2560 + 0.5 ),
      ( p[1] * 0.5 * 200 / 2560 + 0.5 )
    ];
  })

  window.positions = positions;
  var count = 0;
  // for (var i=0; i<selectIndex.length; i++) {
  //   var index = selectIndex[i]
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i];

    var ouv = geometry.faceVertexUvs[0][i];
    var va  = geometry.vertices[face.a];
    var vb  = geometry.vertices[face.b];
    var vc  = geometry.vertices[face.c];
    var normal = face.normal;
    var triangle = ouv.map( function (v) {
      return [v.x, v.y];
    })
    var points = polygonBoolean(triangle, positions, 'not')
    if (points.length > 1) {
      points = (points[0].length < points[1].length) ? points[0] : points[1]
    } else {
      points = points[0]
    }
    if (points.length <= 3) { // || va.y < 0) {
      var points = greinerHormann.intersection(positions, triangle)
      if (points && points.length < 3) { // && va.y > 0) {
        var area = areaPolygon(points[0])
        var triArea = areaPolygon(triangle)
        if (area/triArea > 0.5) {
          continue;
        }
        console.log(area/triArea)
      }
      // if (va.z < 1) continue;
      var num = ng.vertices.length;
      ng.vertices.push(va)
      ng.vertices.push(vb)
      ng.vertices.push(vc)
      ng.faces.push(new THREE.Face3(num, num+1, num+2))

      var h = -0.01;
      var v = new THREE.Vector3();
      var h_normal = normal.clone().multiplyScalar(h);
      var outer_a = v.clone().addVectors(va, h_normal)
      var outer_b = v.clone().addVectors(vb, h_normal)
      var outer_c = v.clone().addVectors(vc, h_normal)
      var num = ng.vertices.length;
      ng.vertices.push(outer_a)
      ng.vertices.push(outer_b)
      ng.vertices.push(outer_c)
      ng.faces.push(new THREE.Face3(num, num+1, num+2))
      ng.faces.push(new THREE.Face3(num+2, num+1, num+1))

    } else {
      var diffs = greinerHormann.diff(triangle, positions)
      for (var k=0; k<diffs.length; k++) {
        var diff = diffs[k]
        var outer_triangle = triangle.filter(function (t) {
          for (var di=0; di<diff.length; di++) {
            var dp = diff[di];
            if (_.isEqual(dp, t)) return true;
          }
          return false;
        })
        var d = drawSVG(diff);
        var bndMesh = svgMesh3d(d, {
          scale: 1,
          simplify: Math.pow(10, -3),
          customize: true,
        })
        var nuv = bndMesh.positions;
        var nf = bndMesh.cells;
        var nxyz = uvTo3D(nuv, ouv, va, vb, vc);
        var inner_points = [];
        var outer_points = [];

        for (var j=0; j<nf.length; j++) {
          var num = ng.vertices.length;
          var a = nxyz[nf[j][0]]
          var b = nxyz[nf[j][1]]
          var c = nxyz[nf[j][2]]
          ng.vertices.push(a);
          ng.vertices.push(b);
          ng.vertices.push(c);
          ng.faces.push(new THREE.Face3(num, num+1, num+2))

          var inner_a = ng.vertices[num]
          var inner_b = ng.vertices[num+1]
          var inner_c = ng.vertices[num+2]

          var h = -0.01;
          var v = new THREE.Vector3();
          var h_normal = normal.clone().multiplyScalar(h);
          var outer_a = v.clone().addVectors(inner_a, h_normal)
          var outer_b = v.clone().addVectors(inner_b, h_normal)
          var outer_c = v.clone().addVectors(inner_c, h_normal)
          var num = ng.vertices.length;
          ng.vertices.push(outer_a)
          ng.vertices.push(outer_b)
          ng.vertices.push(outer_c)
          ng.faces.push(new THREE.Face3(num, num+1, num+2))
          ng.faces.push(new THREE.Face3(num+2, num+1, num+1))

          var face_vertices = [va, vb, vc];
          if (isNotTriangle(inner_a, face_vertices)) {
            inner_points.push(inner_a);
            outer_points.push(outer_a);
          }
          if (isNotTriangle(inner_b, face_vertices)) {
            inner_points.push(inner_b);
            outer_points.push(outer_b);
          }
          if (isNotTriangle(inner_c, face_vertices)) {
            inner_points.push(inner_c);
            outer_points.push(outer_c);
          }
        }

        var n = inner_points.length;
        for (var j=0; j<n-1; j++) {
          var ci = inner_points[j];
          var ni = inner_points[j+1];
          var co = outer_points[j];
          var no = outer_points[j+1];

          var num = ng.vertices.length;
          ng.vertices.push(ci);
          ng.vertices.push(co);
          ng.vertices.push(ni);
          ng.faces.push(new THREE.Face3(num, num+1, num+2))
          ng.faces.push(new THREE.Face3(num+2, num+1, num))

          var num = ng.vertices.length;
          ng.vertices.push(co);
          ng.vertices.push(no);
          ng.vertices.push(ni);
          ng.faces.push(new THREE.Face3(num, num+1, num+2))
          ng.faces.push(new THREE.Face3(num+2, num+1, num))
        }

      }
      count++;
      console.log(count);
    }
  }
  console.log('done')
  scene.remove(mesh)
  scene.remove(dm)
  scene.remove(texture)
  nm = new THREE.Mesh(ng, material);
  nm.geometry.verticesNeedUpdate = true;
  nm.dynamic = true;
  nm.castShadow = true;
  nm.receiveShadow = true;
  nm.position.x = mesh.position.x;
  nm.position.y = mesh.position.y;
  nm.position.z = mesh.position.z;
  nm.rotation.x = mesh.rotation.x;
  nm.rotation.y = mesh.rotation.y;
  nm.rotation.z = mesh.rotation.z;
  nm.scale.set(6, 6, 6)
  scene.add(nm);
}

var checked = []
function isNotTriangle (v, face_vertices) {
  // var epsilon = Math.pow(10, -2);
  for (var j=0; j<face_vertices.length; j++) {
    var t = face_vertices[j];
    if (_.isEqual(v, t)) return false;
    // if (Math.abs(t[0]-v[0]) < epsilon && Math.abs(t[1]-v[1])< epsilon) {
    //   console.log(v, t)
    //   return false;
    // }
  }
  // if (checked.includes(v.toString())) return false;
  checked.push(v.toString())
  return true
}

function uvTo3D (nuv, ouv, va, vb, vc) {
  var nxyz = nuv.map(function (uv) {
    var uv_a = ouv[0];
    var uv_b = ouv[1];
    var uv_c = ouv[2];
    var A = [
      [uv_a.x - uv_c.x, uv_b.x - uv_c.x],
      [uv_a.y - uv_c.y, uv_b.y - uv_c.y]
    ];
    var B = [uv[0] - uv_c.x, uv[1] - uv_c.y];
    var x = numeric.solve(A, B)
    var a = x[0], b = x[1]
    console.log({ a: a, b: b })
    // convert uv to xyz with a, b, 1-a-b

    var v = new THREE.Vector3();
    v.x = a*va.x + b*vb.x + (1-a-b)*vc.x;
    v.y = a*va.y + b*vb.y + (1-a-b)*vc.y;
    v.z = a*va.z + b*vb.z + (1-a-b)*vc.z;
    return v;
  })
  return nxyz;
}
