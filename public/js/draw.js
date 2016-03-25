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
  .then(computeVertexNormals(geometry))
  .then(createObj(geometry))

  .then(segmentObjects())

}

function drawObjects () {
  // drawGeometry()
  drawObj();
  // drawSTL();
}

function createObj (geometry) {
  var json = {
    uniq: geometry.uniq,
    faces: geometry.faces,
    map: geometry.map
  }
  socket.emit('connection', json)
}

function drawObj () {

  var loader = new THREE.OBJLoader();
  loader.load('/data/hoge.obj', function ( object ) {
    object.children[0].geometry.computeFaceNormals();
    var geo = object.children[0].geometry;
    geo.dynamic = true;

    var positions = geo.attributes.position.array;
    var n = positions.length/9;

    geometry = new THREE.Geometry();
    for (var i=0; i<n; i++) {
      var v1 = new THREE.Vector3(
        positions[9*i],
        positions[9*i+1],
        positions[9*i+2]
      )
      var v2 = new THREE.Vector3(
        positions[9*i+3],
        positions[9*i+4],
        positions[9*i+5]
      )
      var v3 = new THREE.Vector3(
        positions[9*i+6],
        positions[9*i+7],
        positions[9*i+8]
      )
      var num = geometry.vertices.length;
      geometry.vertices.push(v1);
      geometry.vertices.push(v2);
      geometry.vertices.push(v3);
      geometry.faces.push(new THREE.Face3(num, num+1, num+2))
    }
    geometry.computeFaceNormals();
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
  });
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


function drawGeometry (shape) {
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

