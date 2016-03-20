var objects = [];
var materials = [];
THREE.ImageUtils.crossOrigin = '';

var a = new THREE.Vector3(1, 0, 0);
var b = new THREE.Vector3(0, 0, 1);
var c = new THREE.Vector3(0, 1, 0);
var ab = new THREE.Vector3();
var bc = new THREE.Vector3();
ab.subVectors(b, a);
bc.subVectors(c, b);

var normal = new THREE.Vector3();
normal.crossVectors(ab, bc)
normal.normalize()

var triangle;
var cylinder;

function loadObjects () {
  Q.call(computeUniq(geometry))
  .then(computeEdges(geometry))
  .then(computeEdgeLength(geometry))
  .then(computeAngle(geometry))
  .then(computeCcwEdges(geometry))
  // .then(computeBoundary(geometry))
  // .then(computeLaplacian(geometry))
  // .then(getDgpc(geometry))
  // .then(computeHarmonicField(geometry))

  .then(hoge(geometry))


  // .then(getBoundary(geometry))
  // .then(getMapping(geometry))
}

function drawObjects () {
  // drawSphere()
  // drawBox()
  // drawRing();
  // drawTorus()
  drawCylinder();
  // drawObj();
  // drawSTL();
}

function drawObj () {

  $.ajax({
    url: '/get-obj',
    type: 'POST',
    datatype: 'JSON',
    data: { },
    success: function (data) {
      console.log('Get result');
      window.json = JSON.parse(data);

      geometry = new THREE.Geometry();
      var vertices = [];
      for (var i=0; i<json.vertices.length/3; i++) {
        var vertex = new THREE.Vector3(
          json.vertices[3*i],
          json.vertices[3*i+1],
          json.vertices[3*i+2]
        );
        vertices.push(vertex);
      }
      for (var j=0; j<json.faces.length/8; j++) {
        var v1 = vertices[json.faces[8*j+1]]
        var v2 = vertices[json.faces[8*j+2]]
        var v3 = vertices[json.faces[8*j+3]]
        var num = geometry.vertices.length;
        geometry.vertices.push(v1)
        geometry.vertices.push(v2)
        geometry.vertices.push(v3)
        var face = new THREE.Face3(num, num+1, num+2);
        geometry.faces.push(face);
      }
      loadObjects()
      // var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
      // mesh = new THREE.Mesh(geometry, material);
      // scene.add(mesh)
    }
  })

  // var loader = new THREE.OBJLoader();
  // loader.load('/public/assets/bunny_1k.obj', function (object) {
  //   object.traverse( function ( child ) {
  //     if ( child instanceof THREE.Mesh ) {
  //       child.material.map = texture;
  //     }
  //   } );
  //   scene.add( object );
  //   window.mesh = object;
  //   getDgpc()
  // });
}

function hoge (geometry) {
  for (var i=0; i<json.uvs[0].length/2; i++) {
    var u = json.uvs[0][2*i]
    var v = json.uvs[0][2*i+1]
    var uv = new THREE.Vector2(u, v)
    if (!geometry.uniq[i]) continue;
    geometry.uniq[i].uv = uv;
  }

  geometry.faceVertexUvs = [[]]
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i];
    geometry.faceVertexUvs[0].push([
      geometry.uniq[map[face.a]].uv,
      geometry.uniq[map[face.b]].uv,
      geometry.uniq[map[face.c]].uv,
    ])
  }
  geometry.uvsNeedUpdate = true;
  geometry.buffersNeedUpdate = true;

  var loader = new THREE.TextureLoader();
  loader.load('/bunny_1k.png', function (image) {
    image.minFilter = THREE.LinearFilter;
    image.needsUpdate = true;
    // image.wrapS = THREE.RepeatWrapping;
    // image.wrapT = THREE.RepeatWrapping;
    // image.repeat.set(4, 4);
    // mesh.material.color = new THREE.Color('yellow')
    // mesh.material.map = image;
    // mesh.material.needsUpdate = true;
    // if (mesh) scene.remove(mesh);
    var material = new THREE.MeshBasicMaterial({map: image});
    mesh = new THREE.Mesh(geometry, material);
    // mesh.material.color = new THREE.Color('yellow')
    mesh.material.map = image;
    mesh.material.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.set(10, 10, 10)
    scene.add(mesh);
  })

}


function getDgpc (geometry) {
  console.log('Start getMapping')
  var json = {
    filename: 'bunny_1k'
    // uniq: geometry.uniq,
    // faces: geometry.faces,
    // map: geometry.map,
    // boundary: geometry.boundary
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

      for (var i=0; i<data.uv.length; i++) {
        var hash = data.uv[i];
        if (i>100) break;
        var u = hash.r * Math.cos(hash.theta);
        var v = hash.r * Math.sin(hash.theta);
        var uv = new THREE.Vector2(u, v)
        geometry.uniq[i].uv = uv;
      }

      geometry.faceVertexUvs = [[]]
      for (var i=0; i<geometry.faces.length; i++) {
        var face = geometry.faces[i];
        geometry.faceVertexUvs[0][i] = [
          geometry.uniq[map[face.a]].uv,
          geometry.uniq[map[face.b]].uv,
          geometry.uniq[map[face.c]].uv,
        ]
      }

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
        // if (mesh) scene.remove(mesh);
        var material = new THREE.MeshBasicMaterial({map: image});
        mesh = new THREE.Mesh(geometry, material);
        mesh.material.color = new THREE.Color('yellow')
        mesh.material.map = image;
        mesh.material.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.scale.set(10, 10, 10)
        scene.add(mesh);
      })
    }
  })
}

function drawSTL () {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if ( xhr.readyState == 4 ) {
      if ( xhr.status == 200 || xhr.status == 0 ) {
        console.log(xhr)
        var rep = xhr.response; // || xhr.mozResponseArrayBuffer;
        console.log(rep);
        parseStlBinary(rep);
        // parseStl(rep);
        window.geometry = mesh.geometry;
        mesh.geometry.verticesNeedUpdate = true;
        mesh.dynamic = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material.color.set(new THREE.Color('blue'))
        // mesh.position.y = 1;
        // mesh.rotation.x = 5;
        // mesh.rotation.z = .25;
        // for mavin
        // mesh.scale.set(0.1, 0.1, 0.1);
        console.log('done parsing');
        loadObjects();
      }
    }
  }
  xhr.onerror = function(e) {
    console.log(e);
  }
  xhr.open( "GET", '/public/assets/mini_knight.stl', true );
  // xhr.open( "GET", '/public/assets/noah-4.stl', true );
  // if STL is binary
  xhr.responseType = "arraybuffer";
  xhr.send( null );
}

function drawTorus () {
  torus = new THREE.Mesh(
    new THREE.TorusKnotGeometry( size, 0.3*size, 100, 8),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  )
  torus.geometry.verticesNeedUpdate = true;
  torus.dynamic = true;
  torus.castShadow = true;
  torus.receiveShadow = true;
  scene.add(torus);
  objects.push(torus);
  window.geometry = torus.geometry
  mesh = torus;
  mesh.material.color.set(new THREE.Color('blue'))
  loadObjects();
}

function drawSphere () {
  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(size, 30, 30),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  );
  sphere.geometry.verticesNeedUpdate = true;
  sphere.dynamic = true;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);
  objects.push(sphere);
  window.geometry = sphere.geometry
  mesh = sphere;
  mesh.material.color.set(new THREE.Color('blue'))
  loadObjects();
}

function drawRing () {
  ring = new THREE.Mesh(
    new THREE.RingGeometry(size, size*2, 32),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  );
  ring.geometry.verticesNeedUpdate = true;
  ring.dynamic = true;
  ring.castShadow = true;
  ring.receiveShadow = true;
  scene.add(ring);
  objects.push(ring);
  window.geometry = ring.geometry
  mesh = ring;
  mesh.material.color.set(new THREE.Color('blue'))
  loadObjects();
}

function drawCylinder () {
  limit = 0.4;
  start = 13;
  geometry = new THREE.CylinderGeometry(size, size, size, 2);

  // cylinder = new THREE.Mesh(
  //   new THREE.CylinderGeometry(size, size, size*2, 40, 3),
  //   new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  // );
  // cylinder.geometry.verticesNeedUpdate = true;
  // cylinder.dynamic = true;
  // cylinder.castShadow = true;
  // cylinder.receiveShadow = true;
  // scene.add(cylinder);
  // objects.push(cylinder);
  // window.geometry = cylinder.geometry
  // mesh = cylinder;
  // mesh.material.color.set(new THREE.Color('blue'))
  // loadObjects();

  var loader = new THREE.TextureLoader();
  loader.load('/bunny_1k.png', function (image) {
    image.minFilter = THREE.LinearFilter;
    image.needsUpdate = true;
    // image.wrapS = THREE.RepeatWrapping;
    // image.wrapT = THREE.RepeatWrapping;
    // image.repeat.set(4, 4);
    // mesh.material.color = new THREE.Color('yellow')
    // mesh.material.map = image;
    // mesh.material.needsUpdate = true;
    // if (mesh) scene.remove(mesh);
    var material = new THREE.MeshBasicMaterial({map: image});
    mesh = new THREE.Mesh(geometry, material);
    // mesh.material.color = new THREE.Color('yellow')
    mesh.material.map = image;
    mesh.material.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // mesh.scale.set(10, 10, 10)
    scene.add(mesh);
  })


}

function drawBox () {
  box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size, 10, 10, 10),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  );
  box.geometry.verticesNeedUpdate = true;
  box.dynamic = true;
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  objects.push(box);
  window.geometry = box.geometry
  mesh = box;
  mesh.material.color.set(new THREE.Color('blue'))
  loadObjects();
}

