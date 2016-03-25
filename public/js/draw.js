var objects = [];

function loadObjects () {
  Q.fcall(computeUniq(geometry))
  .then(computeEdges(geometry))
  .then(computeEdgeLength(geometry))
  .then(computeAngle(geometry))
  .then(computeCcwEdges(geometry))
  .then(computeVertexNormals(geometry))
  .then(createObj(geometry))

  // .then(segmentObjects())
}

function drawGeometry () {
  // drawBasicGeometry()
  loadObj('/data/bunny.obj', drawObj)
  // loadStl('/data/demo.stl', drawStl);
}

function drawObj (geometry) {
  window.geometry = geometry
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(6, 6, 6)
  mesh.position.setY(-1)
  scene.add(mesh);
  objects.push(mesh)
  loadObjects()
}

function drawStl (geometry) {
  window.geometry = geometry
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(1, 1, 1)
  mesh.position.setY(-1)
  scene.add(mesh);
  objects.push(mesh)
  loadObjects()
}

function drawBasicGeometry (shape) {
  switch (shape) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(size, 30, 30)
    case 'box':
      geometry = new THREE.BoxGeometry(size, size, size, 10, 10, 10)
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(size, size, size, 2)
    case 'torus':
      geometry = new THREE.TorusKnotGeometry( size, 0.3*size, 100, 8)
    default:
      geometry = new THREE.CylinderGeometry(size, size, size, 2)
  }
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
  });
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
  // socket.emit('connection', json)
}


