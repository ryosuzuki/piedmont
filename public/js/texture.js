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
  socket.on('res-update', function (result) {
    var e = new Date().getTime();
    var time = e - s;
    // console.log('Execution time: ' + time + 'ms');
    var start = result.start
    window.uvs[start] = result.uv
    updateMapping(start)
  })
})

function getDgpc (start) {
  if (running) return false
  if (_.size(origin_uvs) > 0) return false
  // if (origin_uvs[start] && origin_uvs[start].r < 0.1) return false
  running = true

  console.log('start: ' + start)
  if (_.has(window.uvs, start)) {
    updateMapping(start)
  } else {
    s = new Date().getTime();
    socket.emit('update', start)
  }
}

var origin
var updated_uvs = {}
function updateMapping (start) {
  var uvs
  origin = start
  window.origin_uvs = window.uvs[origin]
  var uvs = origin_uvs
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
  showDrawingCanvas()
  // showCheckerMark()
  running = false
}

function showCheckerMark () {
  var m = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: image,
    // transparent: true
  });
  dm = new THREE.Mesh(g, m);
  dm.scale.set(6, 6, 6)
  dm.position.setY(-1)
  scene.add(dm);


  for (var id in origin_uvs) {
    var hash = origin_uvs[id]
    if (hash.theta == 0 && id !== origin) {
      ep = geometry.uniq[id]
    }
  }
  console.log(ep.id)
  getDgpc(ep.id)


}

function showDrawingCanvas () {
  if (ng) return false
  scene.remove(dm)
  var canvas = document.getElementById('drawing')
  var m = new THREE.MeshLambertMaterial({
    map: new THREE.Texture(canvas),
    transparent: true
  });
  // m.map.magFilter = THREE.NearestFilter
  m.map.minFilter = THREE.LinearFilter
  // m.map.wrapS = THREE.RepeatWrapping;
  // m.map.wrapT = THREE.RepeatWrapping;
  // m.map.repeat.set(2, 2);
  m.map.needsUpdate = true;
  dm = new THREE.Mesh(g, m);
  dm.scale.set(6, 6, 6)
  dm.position.setY(-1)
  scene.add(dm);
}




  // geometry.dynamic = true;
  // geometry.uvsNeedUpdate = true;
  // geometry.buffersNeedUpdate = true;
  // geometry.verticesNeedUpdate = true;
  // geometry.elementsNeedUpdate = true;
  // geometry.morphTargetsNeedUpdate = true;
  // geometry.uvsNeedUpdate = true;
  // geometry.normalsNeedUpdate = true;
  // geometry.colorsNeedUpdate = true;
  // geometry.tangentsNeedUpdate = true;
  // material.needsUpdate = true;

  // // mesh.material.color.setHex(Math.random() * 0xffffff);
  // // mesh.material.map = new THREE.TextureLoader().load('/bunny_1k.png')
  // var canvas = document.getElementById('canvas');
  // var image = new THREE.Texture(canvas)
  // image.needsUpdate = true;
  // mesh.material.color = 0xffffff;
  // mesh.material.map = image;
  // // mesh.material.map = image;
  //
  // geometry.faceVertexUvs = faceVertexUvs;
  // geometry.uvsNeedUpdate = true;
  // geometry.computeFaceNormals()
  // geometry.computeVertexNormals()
  // geometry.dynamic = true;
  // geometry.uvsNeedUpdate = true;


  // scene.remove(mesh);
  // mesh = new THREE.Mesh(geometry, material);
  // mesh.geometry.faceVertexUvs = faceVertexUvs;
  // mesh.geometry.uvsNeedUpdate = true;

  // mesh.material.needsUpdate = true;
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;



function addTexture () {
  createTexture();
  // Q.fcall(createTexture)
  // .then(computeUniq(geometry))

  // .then(computeLaplacian(geometry))
  // .then(getBoundary(geometry))
  // .then(getMapping(geometry))

}

function createTexture () {
  var textureGeometry = new THREE.Geometry();
  for (var i=0; i<selectIndex.length; i++) {
    var index = selectIndex[i];
    var face = geometry.faces[index];
    var v1 = geometry.vertices[face.a];
    var v2 = geometry.vertices[face.b];
    var v3 = geometry.vertices[face.c];
    var num = textureGeometry.vertices.length;
    textureGeometry.vertices.push(v1);
    textureGeometry.vertices.push(v2);
    textureGeometry.vertices.push(v3);
    var textureFace = new THREE.Face3(num, num+1, num+2);
    textureFace.map = [face.a, face.b, face.c];
    textureFace.original = index;
    textureFace.normal = face.normal;
    textureGeometry.faces.push(textureFace);
    textureGeometry.verticesNeedUpdate = true;
    // textureGeometry.faceVertexUvs[0].push([
    //   new THREE.Vector2(a.uv.u, a.uv.v),
    //   new THREE.Vector2(b.uv.u, b.uv.v),
    //   new THREE.Vector2(c.uv.u, c.uv.v)
    // ]);
    // textureGeometry.uvsNeedUpdate = true;
  }

  // window.texture = texture;

  Q.call(computeUniq(textureGeometry))
  // .then(computeLaplacian(textureGeometry))
  // .then(getBoundary(textureGeometry))
  .then(computeEdges(textureGeometry))
  .then(computeEdgeLength(textureGeometry))
  .then(computeAngle(textureGeometry))
  .then(computeBoundary(textureGeometry))
  .then(getMapping(textureGeometry))
  // .then(addLine(textureGeometry))
  return textureGeometry;
}

function getBoundary2 (geometry) {
  console.log('Start getBoundary');
  var uniq = geometry.uniq;
  var map = geometry.map;
  var edges = geometry.edges;
  var faces = geometry.faces;

  var sortUniq = _.sortBy(uniq, 'edges.length').filter( function (u) {
    return u.edges.length >= 2;
  });

  var id = sortUniq[0].id
  // sword: 1159;
  // bottom: 1814;
  // neck: 200;
  var checked = [];
  var current;
  while (true) {
    current = uniq[id];
    var remains = _.pullAll(current.edges, checked);
    if (remains.length <= 0) break;
    id = remains[0];
    checked = _.union(checked, [id]);
  }
  boundary = checked;
  geometry.boundary = boundary;
  console.log('Finish getBoundary')
  return geometry;
}

var line;
function addLine (texture) {
  var material = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 10
  });
  var geometry = new THREE.Geometry();
  for (var i=0; i<texture.geometry.boundary.length; i++) {
    var id = texture.geometry.boundary[i];
    var v = texture.geometry.uniq[id].vertex;
    geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
  };
  if (line) scene.remove(line)
  line = new THREE.Line(geometry, material);
  var rot = mesh.rotation;
  var pos = mesh.position;
  line.castShadow = true;
  line.receiveShadow = true;
  line.rotation.set(rot.x, rot.y, rot.z, rot.order)
  line.castShadow = true;
  line.receiveShadow = true;
  line.position.set(pos.x, pos.y, pos.z);
  scene.add(line);
}

function getMapping2 (geometry) {
  console.log('Start getMapping')
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map,
    boundary: geometry.boundary
  };
  $.ajax({
    url: '/get-mapping',
    type: 'POST',
    datatype: 'JSON',
    data: {
      json: JSON.stringify(json)
    },
    success: function (data) {
      console.log('Get result');
      console.log(data);

      geometry.uniq = data.uniq;
      // uniq = geometry.uniq;

      var uniq = geometry.uniq;
      var tmap = geometry.map;
      var faces = geometry.faces;

      geometry.computeBoundingBox();
      var max = geometry.boundingBox.max;
      var min = geometry.boundingBox.min;
      var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
      var range = new THREE.Vector2(max.x- min.x, max.y - min.y);

      geometry.faceVertexUvs[0] = []
      for (var i=0; i<faces.length; i++) {
        var face = faces[i];
        var a = uniq[tmap[face.a]];
        var b = uniq[tmap[face.b]];
        var c = uniq[tmap[face.c]];
        var uv = [
          new THREE.Vector2(
            (a.uv.u + offset.x) / range.x,
            (a.uv.v + offset.y) / range.y
          ),
          new THREE.Vector2(
            (b.uv.u + offset.x) / range.x,
            (b.uv.v + offset.y) / range.y
          ),
          new THREE.Vector2(
            (c.uv.u + offset.x) / range.x,
            (c.uv.v + offset.y) / range.y
          )
        ];
        geometry.faceVertexUvs[0].push(uv);
        // var index = face.original;
        // geometry.faceVertexUvs[0][index] = uv;
      }
      geometry.uvsNeedUpdate = true;
      geometry.buffersNeedUpdate = true;
      var rot = mesh.rotation;
      var pos = mesh.position;
      var axis = new THREE.Vector3(0, 1, 0);
      var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
      var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
      var loader = new THREE.TextureLoader();
      loader.load('/public/assets/checkerboard.jpg', function (image) {
        image.minFilter = THREE.LinearFilter;
        image.needsUpdate = true;
        // image.wrapS = THREE.RepeatWrapping;
        // image.wrapT = THREE.RepeatWrapping;
        // image.repeat.set(2, 2);
        // mesh.material.color = new THREE.Color('yellow')
        // mesh.material.map = image;
        // mesh.material.needsUpdate = true;
        if (texture) scene.remove(texture);
        var textureMaterial = new THREE.MeshBasicMaterial({map: image});
        texture = new THREE.Mesh(geometry, textureMaterial);
        texture.material.color = new THREE.Color('yellow')
        texture.material.map = image;
        texture.material.needsUpdate = true;
        texture.castShadow = true;
        texture.receiveShadow = true;
        texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
        texture.castShadow = true;
        texture.receiveShadow = true;
        texture.position.set(pos.x, pos.y, pos.z);
        scene.add(texture);

      });
      // var image = THREE.ImageUtils.loadTexture('/assets/checkerboard.jpg');
      // texture.material = new THREE.MeshBasicMaterial({map: image});
      // addLine(texture)
    }
  });
}


/*
function getDgpc2 (start) {
  console.log('Start getMapping')
  var s = new Date().getTime();

  var json = {
    // uniq: geometry.uniq,
    // faces: geometry.faces,
    // map: geometry.map,
    start: start
  };

  $.ajax({
    url: '/get-dgpc',
    type: 'POST',
    datatype: 'JSON',
    data: {
      json: JSON.stringify(json)
    },
    success: function (data) {
      console.log('Get result');
      console.log(data);
      window.data = data;




      // var loader = new THREE.TextureLoader();
      // loader.load('/bunny_1k.png', function (image) {
      //   image.minFilter = THREE.LinearFilter;
      //   image.needsUpdate = true;
      //   image.wrapS = THREE.RepeatWrapping;
      //   image.wrapT = THREE.RepeatWrapping;
      //   // image.repeat.set(4, 4);
      //   mesh.material = new THREE.MeshBasicMaterial({
      //     vertexColors: THREE.FaceColors,
      //     map: image
      //   });
      //   // mesh = new THREE.Mesh(geometry, material);
      //   // mesh.material.color = new THREE.Color('yellow')

      //   mesh.geometry.dynamic = true;
      //   mesh.geometry.uvsNeedUpdate = true;
      //   mesh.geometry.verticesNeedUpdate = true;
      //   mesh.geometry.elementsNeedUpdate = true;
      //   mesh.geometry.morphTargetsNeedUpdate = true;
      //   mesh.geometry.uvsNeedUpdate = true;
      //   mesh.geometry.normalsNeedUpdate = true;
      //   mesh.geometry.colorsNeedUpdate = true;
      //   mesh.geometry.tangentsNeedUpdate = true;
      //   mesh.material.needsUpdate = true;
      //   mesh.material.map.needsUpdate = true;
      //   mesh.material.map = image;
      //   mesh.material.needsUpdate = true;

      //   // mesh.castShadow = true;
      //   // mesh.receiveShadow = true;
      //   // mesh.castShadow = true;
      //   // mesh.receiveShadow = true;
      //   // mesh.scale.set(10, 10, 10)
      //   // scene.add(mesh);
      // });



      var e = new Date().getTime();
      var time = e - s;
      console.log('Execution time: ' + time + 'ms');

      // var loader = new THREE.TextureLoader();
      // loader.load('/bunny_1k.png', function (image) {
      //   image.minFilter = THREE.LinearFilter;
      //   image.needsUpdate = true;
      //   image.wrapS = THREE.RepeatWrapping;
      //   image.wrapT = THREE.RepeatWrapping;
      //   image.repeat.set(4, 4);
      //   var material = new THREE.MeshBasicMaterial({map: image});
      //   mesh = new THREE.Mesh(geometry, material);
      //   // mesh.material.color = new THREE.Color('yellow')
      //   mesh.material.map = image;
      //   mesh.material.needsUpdate = true;
      //   mesh.castShadow = true;
      //   mesh.receiveShadow = true;
      //   mesh.castShadow = true;
      //   mesh.receiveShadow = true;
      //   mesh.scale.set(10, 10, 10)
      //   scene.add(mesh);

      //   var g = new THREE.Geometry();
      //   g.vertices.push(geometry.uniq[start].vertex);
      //   var m = new THREE.PointsMaterial( { size: 20, sizeAttenuation: false} );
      //   m.color.setHex(Math.random() * 0xffffff);
      //   var p = new THREE.Points(g, m);
      //   p.scale.set(10, 10, 10)
      //   scene.add(p);

      // })
    }
  })
}
*/


    /*
    var diff_uvs = {}
    for (var id in current_uvs) {
      var hash = current_uvs[id]
      var id_1 = hash.id
      var r_1 = hash.r
      var theta_1 = Math.abs(theta_origin - hash.theta)
      var r_est = Math.sqrt( r_origin*r_origin + r_1*r_1 - 2*r_origin*r_1*Math.cos(theta_1) )
      var cos_est = ( r_est*r_est + r_origin*r_origin - r_1*r_1 ) / ( 2*r_est*r_origin )
      var theta_est = Math.acos(cos_est)
      theta_est = theta_est + theta_0 // ???
      // if (r_est < 0.2) {
        diff_uvs[id] = { r: r_est, theta: theta_est }
      // }
    }

    var updated_uvs = {}
    for (var id in origin_uvs) {
      var hash = origin_uvs[id]
      var diff_hash = diff_uvs[id]

      var r
      var theta
      if (diff_hash && hash.r > 0.1) {
        r = 0.5*hash.r + 0.5*diff_hash.r
        theta = hash.theta //0.5*hash.theta + 0.5*diff_hash.theta
      } else {
        r = hash.r
        theta = hash.theta
      }
      var u = r * Math.cos(theta) + 0.5
      var v = r * Math.sin(theta) + 0.5
      updated_uvs[id] = { r: r, theta: theta, u: u, v: v }
    }
    */

  /*
  if (_.size(window.uvs) > 1) {
    var current_uvs = window.uvs[start]

    var theta_0 = origin_uvs[start].theta

    var r_origin = current_uvs[origin].r
    var theta_origin = current_uvs[origin].theta

    var v = new THREE.Vector3()
    var vp = geometry.uniq[origin]
    var vq = geometry.uniq[start]
    var np = vp.vertex_normal
    var nq = vq.vertex_normal

    var ep
    var eq
    for (var id in origin_uvs) {
      var hash = origin_uvs[id]
      if (hash.theta == 0 && id !== origin) {
        ep = geometry.uniq[id]
      }
    }
    for (var id in current_uvs) {
      var hash = current_uvs[id]
      if (hash.theta == 0 && id !== start) {
        eq = geometry.uniq[id]
      }
    }
    var xp = v.clone().subVectors(ep.vertex, vp.vertex).normalize()
    var xq = v.clone().subVectors(eq.vertex, vq.vertex).normalize()

    var u_pq = new THREE.Vector2(updated_uvs[start].u, updated_uvs[start].v)
    var u_p = new THREE.Vector2(0, 0)
    var u_q = new THREE.Vector2(updated_uvs[start].u, updated_uvs[start].v)
    var angle = Math.acos(np.dot(nq))
    var xq_prime = xq.clone().applyAxisAngle(nq, angle).normalize()
    var theta_pq = Math.acos(xp.dot(xq_prime))

    theta_pq = origin_uvs[eq.id].theta

    console.log(theta_pq)
    for (var id in current_uvs) {
      var hash = current_uvs[id]
      // if (hash.r > 0.05) continue
      // hash = origin_uvs[id]
      if (updated_uvs[id]) continue
      if (!updated_uvs[start]) continue
      var u_qr = new THREE.Vector2(hash.u, hash.v)
      var u_qr_hat = u_qr.clone().rotateAround(u_q, -theta_pq)
      var u_pr = u_p.clone().addVectors(u_pq, u_qr_hat)

      var u_r = u_pr
      var distance_p = u_r.distanceTo(u_p)
      var distance_q = u_r.distanceTo(u_q)
      var alpha = (distance_q)/(distance_p+distance_q)
      updated_uvs[id] = {
        u: alpha*hash.u + (1-alpha)*u_pr.x,
        v: alpha*hash.v + (1-alpha)*u_pr.y
      }
    }
    window.updated_uvs = updated_uvs
    debugger

  } else {
    for (var id in origin_uvs) {
      var hash = origin_uvs[id]
      updated_uvs[id] = {
        u: hash.u,
        v: hash.v
      }
    }
  }
  */

