var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  // side: THREE.DoubleSide,
  wireframe: true,
})
// material.color.set(new THREE.Color('blue'))

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

function replaceObject (svgMesh) {
  if (ng) scene.remove(ng);

  ng = new THREE.Geometry();
  for (var i=0; i<geometry.faces.length; i++) {
    // if (selectIndex.includes(i)) continue;
    var face = geometry.faces[i];
    var normal = face.normal;
    var va  = geometry.vertices[face.a];
    var vb  = geometry.vertices[face.b];
    var vc  = geometry.vertices[face.c];
    var num = ng.vertices.length;
    ng.vertices.push(va);
    ng.vertices.push(vb);
    ng.vertices.push(vc);
    ng.faces.push(new THREE.Face3(num, num+1, num+2))
  }

  var positions = svgMesh.positions;

  // Centerize positions around [0, 1]
  positions = positions.map(function (p) {
    return [(p[0]*0.2)+0.5, (p[1]*0.2)+0.5];
  })
  window.positions = positions;
  var count = 0;
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  for (var i=0; i<selectIndex.length; i++) {
    var index = selectIndex[i]
    var face = geometry.faces[index];

    var ouv = geometry.faceVertexUvs[0][index];
    var va  = geometry.vertices[face.a];
    var vb  = geometry.vertices[face.b];
    var vc  = geometry.vertices[face.c];
    var normal = face.normal;

    var faces_a = geometry.uniq[geometry.map[face.a]].faces;
    var faces_b = geometry.uniq[geometry.map[face.b]].faces;
    var faces_c = geometry.uniq[geometry.map[face.c]].faces;

    var faces_ab = _.intersection(faces_a, faces_b);
    var faces_bc = _.intersection(faces_b, faces_c);
    var faces_ca = _.intersection(faces_c, faces_a);

    var v = new THREE.Vector3()
    var n1 = geometry.faces[faces_ab[0]].normal;
    var n2 = geometry.faces[faces_ab[1]].normal;
    var normal_ab = v.clone().addVectors(n1, n2).normalize();

    var n1 = geometry.faces[faces_bc[0]].normal;
    var n2 = geometry.faces[faces_bc[1]].normal;
    var normal_bc = v.clone().addVectors(n1, n2).normalize();

    var n1 = geometry.faces[faces_ca[0]].normal;
    var n2 = geometry.faces[faces_ca[1]].normal;
    var normal_ca = v.clone().addVectors(n1, n2).normalize();

    var normal_a = face.vertexNormals[0];
    var normal_b = face.vertexNormals[0];
    var normal_c = face.vertexNormals[0];
    var face_info = {
      va: va,
      vb: vb,
      vc: vc,
      normal: normal,
      normal_a: normal_a,
      normal_b: normal_b,
      normal_c: normal_c,
      normal_ab: normal_ab,
      normal_bc: normal_bc,
      normal_ca: normal_ca
    }

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
    } else {
      // var diffs = greinerHormann.diff(triangle, positions)
      // for (var k=0; k<diffs.length; k++) {
      //   var diff = diffs[k]
      //   var outer_face = triangle.map(function (t, index) {
      //     for (var di=0; di<diff.length; di++) {
      //       var dp = diff[di];
      //       if (_.isEqual(dp, t)) return true;
      //     }
      //     return false;
      //   })
      //   var d = drawSVG(diff);

      var intersections = greinerHormann.intersection(positions, triangle)
      for (var k=0; k<intersections.length; k++) {
        var intersection = intersections[k]
        var outer_triangle = triangle.filter(function (t) {
          for (var ii=0; ii<intersection.length; ii++) {
            var ip = intersection[ii];
            if (_.isEqual(ip, t)) return true;
          }
          return false;
        })

        var d = drawSVG(intersection);
        var bndMesh = svgMesh3d(d, {
          scale: 1,
          simplify: Math.pow(10, -3),
          randomization: 10,
          customize: true,
        })
        var nuv = bndMesh.positions;
        var nf = bndMesh.cells;
        var nxyz = uvTo3D(nuv, ouv, face_info);

        for (var j=0; j<nf.length; j++) {
          var a = nxyz[nf[j][0]]
          var b = nxyz[nf[j][1]]
          var c = nxyz[nf[j][2]]

          var inner_a = a.vertex;
          var inner_b = b.vertex;
          var inner_c = c.vertex;
          var num = ng.vertices.length;
          ng.vertices.push(inner_a);
          ng.vertices.push(inner_b);
          ng.vertices.push(inner_c);
          ng.faces.push(new THREE.Face3(num, num+1, num+2))

          var h = 0.1;
          var v = new THREE.Vector3();
          var normal_a = a.normal.clone().multiplyScalar(h);
          var normal_b = b.normal.clone().multiplyScalar(h);
          var normal_c = c.normal.clone().multiplyScalar(h);
          var h_normal = normal.clone().multiplyScalar(h);
          var outer_a = v.clone().addVectors(inner_a, normal_a)
          var outer_b = v.clone().addVectors(inner_b, normal_b)
          var outer_c = v.clone().addVectors(inner_c, normal_c)
          var num = ng.vertices.length;
          ng.vertices.push(outer_a);
          ng.vertices.push(outer_b);
          ng.vertices.push(outer_c);
          ng.faces.push(new THREE.Face3(num, num+1, num+2))

          var inner_points = [inner_a, inner_b, inner_c];
          var outer_points = [outer_a, outer_b, outer_c];

          var ab = inner_a.distanceTo(inner_b);
          var bc = inner_b.distanceTo(inner_c);
          var ca = inner_c.distanceTo(inner_a);

          for (var l=0; l<3; l++) {
            var ci = inner_points[l];
            var ni = inner_points[(l+1)%3];
            var co = outer_points[l];
            var no = outer_points[(l+1)%3];

            var num = ng.vertices.length;
            ng.vertices.push(ci);
            ng.vertices.push(co);
            ng.vertices.push(ni);
            // ng.faces.push(new THREE.Face3(num, num+1, num+2))
            ng.faces.push(new THREE.Face3(num+2, num+1, num))

            var num = ng.vertices.length;
            ng.vertices.push(co);
            ng.vertices.push(no);
            ng.vertices.push(ni);
            // ng.faces.push(new THREE.Face3(num, num+1, num+2))
            ng.faces.push(new THREE.Face3(num+2, num+1, num))
          }
          /*
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
          }*/
        }

        /*
        window.inner_points = inner_points
        window.outer_points = outer_points
        window.ne = ne;
        for (var j=0;j<ne.length; j++) {
          var ci = inner_points[ne[j][0]];
          var ni = inner_points[ne[j][1]];
          var co = outer_points[ne[j][0]];
          var no = outer_points[ne[j][1]];

          var num = ng.vertices.length;
          ng.vertices.push(ci);
          ng.vertices.push(co);
          ng.vertices.push(ni);
          // ng.faces.push(new THREE.Face3(num, num+1, num+2))
          ng.faces.push(new THREE.Face3(num+2, num+1, num))

          var num = ng.vertices.length;
          ng.vertices.push(co);
          ng.vertices.push(no);
          ng.vertices.push(ni);
          // ng.faces.push(new THREE.Face3(num, num+1, num+2))
          ng.faces.push(new THREE.Face3(num+2, num+1, num))
        }
        */
        /*
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
          // ng.faces.push(new THREE.Face3(num, num+1, num+2))
          // ng.faces.push(new THREE.Face3(num+2, num+1, num))

          var num = ng.vertices.length;
          ng.vertices.push(co);
          ng.vertices.push(no);
          ng.vertices.push(ni);
          // ng.faces.push(new THREE.Face3(num, num+1, num+2))
          // ng.faces.push(new THREE.Face3(num+2, num+1, num))
        }
        */

      }
      count++;
      console.log(count);
    }
  }
  console.log('done')
  scene.remove(mesh)
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


var edges = [];
function uvTo3D (nuv, ouv, face_info) {
  var va = face_info.va;
  var vb = face_info.vb;
  var vc = face_info.vc;
  var normal = face_info.normal;
  var normal_a = face_info.normal_a;
  var normal_b = face_info.normal_b;
  var normal_c = face_info.normal_c;
  var normal_ab = face_info.normal_ab;
  var normal_bc = face_info.normal_bc;
  var normal_ca = face_info.normal_ca;

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
    var a = x[0], b = x[1], c = 1-x[0]-x[1];
    // console.log({ a: a, b: b })
    // convert uv to xyz with a, b, 1-a-b

    var epsilon = Math.pow(10, -2)
    if ( Math.abs(a) < epsilon) a = 0;
    if ( Math.abs(b) < epsilon) b = 0;
    if ( Math.abs(c) < epsilon) c = 0;

    if (a == 0 && b == 0) c = 1;
    if (b == 0 && c == 0) a = 1;
    if (c == 0 && a == 0) b = 1;

    // console.log({a: a, b: b, c: c})

    var v = new THREE.Vector3();
    v.x = a*va.x + b*vb.x + c*vc.x;
    v.y = a*va.y + b*vb.y + c*vc.y;
    v.z = a*va.z + b*vb.z + c*vc.z;

    if (a !== 0 && b !== 0 && c == 0) {
      normal = normal_ab;
    }
    if (a == 0 && b !== 0 && c !== 0) {
      normal = normal_bc;
    }
    if (a !== 0 && b == 0 && c !== 0) {
      normal = normal_ca;
    }
    if (a !== 0 && b == 0 && c == 0) {
      normal = normal_a;
    }
    if (a == 0 && b !== 0 && c == 0) {
      normal = normal_b;
    }
    if (a == 0 && b == 0 && c !== 0) {
      normal = normal_c;
    }

    if (a == 0 || b == 0 || c == 0) {
      var exists = false;
      for (var j=0; j<edges.length; j++) {
        var p = edges[j];
        if ( Math.abs(p.x - v.x) < epsilon
          && Math.abs(p.y - v.y) < epsilon
          && Math.abs(p.z - v.z) < epsilon ) {
          v = p;
          exists = true;
          break;
        }
      }
      if (!exists) edges.push(v);
    }

    return { vertex: v, normal: normal};
  })
  return nxyz;
}
