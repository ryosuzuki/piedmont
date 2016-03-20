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
  .then(computeBoundary(geometry))
  .then(computeLaplacian(geometry))
  .then(computeHarmonicField(geometry))

  // .then(getBoundary(geometry))
  // .then(getMapping(geometry))
}

function drawObjects () {
  // drawSphere()
  // drawBox()
  // drawRing();
  // drawTorus()
  // drawCylinder();
  drawSTL();
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
  cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(size, size, size*2, 40, 3),
    new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors })
  );
  cylinder.geometry.verticesNeedUpdate = true;
  cylinder.dynamic = true;
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  scene.add(cylinder);
  objects.push(cylinder);
  window.geometry = cylinder.geometry
  mesh = cylinder;
  mesh.material.color.set(new THREE.Color('blue'))
  loadObjects();
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

