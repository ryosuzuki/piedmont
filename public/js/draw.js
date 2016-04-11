var objects = [];

function loadObjects () {
  initPlaneCanvas()
  geometry.center()
  geometry.computeBoundingSphere()
  var radius = geometry.boundingSphere.radius
  var scale = 0.7 * size / radius
  geometry.scale(scale, scale, scale)
  controls.minDistance = geometry.boundingSphere.radius

  Q.fcall(computeUniq(geometry))
  .then(computeEdges(geometry))
  .then(computeEdgeLength(geometry))
  .then(computeAngle(geometry))
  .then(computeCcwEdges(geometry))
  .then(computeVertexNormals(geometry))
  .then(createObj(geometry))
  // .then(computeLaplacian(geometry))
  // .then(computeLUDecomposition(geometry))

  // .then(segmentObjects())
}

function drawGeometry () {
  switch (window.task) {
    case 1:
      geometry = new THREE.BoxGeometry(2*size, 0.1*size, 2*size, 2, 2, 2)
      drawTaskGeometry()
      break
    case 2:
      loadObj('/data/cylinder.obj', drawStl);
      break
    case 3:
      loadObj('/data/cone.obj', drawStl);
      break
    case 4:
      loadObj('/data/sphere.obj', drawStl);
      break
    case 5:
      loadStl('/data/knight.stl', drawStl);
      break
    case 6:
      loadObj('/data/bunny.obj', drawStl);
      break
    case 7:
      loadStl('/data/tower-1.stl', drawStl);
      break
    case 8:
      // loadStl('/data/demo-2.stl', drawStl);
      loadStl('/data/demo-2.stl', drawStl2);
      loadStl('/data/tower.stl', drawStl);
      break
    default:
      loadStl('/data/tower.stl', drawStl);
  }
}


function drawTaskGeometry () {

  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.geometry.verticesNeedUpdate = true;
  mesh.dynamic = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  objects.push(mesh);
  loadObjects();
}




function drawObj (geometry) {
  window.geometry = geometry
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  });
  mesh = new THREE.Mesh(geometry, wireMaterial);
  scene.add(mesh);
  objects.push(mesh)
  loadObjects()
}


function drawStl2 (geometry) {
  window.geometry = geometry
  var material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    vertexColors: THREE.FaceColors,
    wireframe: true
  });
  mesh2 = new THREE.Mesh(geometry, material);
  // wireMesh = new THREE.Mesh(geometry, wireMaterial);

  if (window.task == 8) {
    mesh2.rotateY(-Math.PI/2)
    mesh2.rotateX(-Math.PI/2)
  }
  scene.add(mesh2);
  // scene.add(wireMesh);
  loadObjects()
}



function drawStl (geometry) {
  window.geometry = geometry
  var material = new THREE.MeshLambertMaterial({
    color: new THREE.Color('white'),
    vertexColors: THREE.FaceColors,
  });
  mesh = new THREE.Mesh(geometry, material);

  if (window.task == 8) {
    mesh.rotateY(-Math.PI/2)
    mesh.rotateX(-Math.PI/2)
  }

  // wireMesh = new THREE.Mesh(geometry, wireMaterial);
  scene.add(mesh);
  // scene.add(wireMesh);
  objects.push(mesh)
  loadObjects()
}

function drawBasicGeometry (shape) {
  switch (shape) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(size, 30, 30)
      break
    case 'box':
      geometry = new THREE.BoxGeometry(size, size, size, 2, 2, 2)
      break
    case 'plane':
      geometry = new THREE.PlaneGeometry(size, size, 10)
      break
    case 'torus':
      geometry = new THREE.TorusKnotGeometry( size, 0.3*size, 100, 8)
      break
    default:
      geometry = new THREE.CylinderGeometry(size, size, 2*size, 30, 2)
  }
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  })
  mesh = new THREE.Mesh(geometry, material)
  mesh.geometry.verticesNeedUpdate = true;
  mesh.dynamic = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  objects.push(mesh);
  loadObjects();
}

function createObj (geometry) {
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map,
    filename: 'demo.obj'
  }
  socket.emit('connection', json)
}


