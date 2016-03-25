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

function createObj (geometry) {
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map,
    filename: 'demo.obj'
  }
  // socket.emit('connection', json)
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

