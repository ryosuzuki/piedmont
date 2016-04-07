var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  wireframe: true,
})
material.color.set(new THREE.Color('blue'))

var ng;
function go () {
  window.scale = 1/55
  Q.fcall(computeUniq(geometry))
  .then(replaceObject(geometry))
}


var z = new THREE.Vector2(0, 0)
var emptyUv = [z, z, z]


function fuga () {
  var a = [0, 1]
  a.forEach( function () {
    console.log('hoge')
    hoge()
  })
}

function hoge (svgPositions) {
  var json = {
    svgPositions: svgPositions,
    geometry: geometry,
    selectIndex: selectIndex,
    faces: geometry.faces,
    faceVertexUvs: geometry.faceVertexUvs,
    vertices: geometry.vertices,
    uniq: geometry.uniq,
    map: geometry.map,
  }
  var data = JSON.stringify(json)
  var worker = new Worker('/worker.js');
  worker.onmessage = function(event) {
    console.log(event.data);
  };
  worker.postMessage(data);
}

function getSvgPositions () {
  var d = window.mickey.pathData
  var svgMesh = svgMesh3d(d, {
    scale: 1,
    simplify: Math.pow(10, -5),
    normalize: true
  })
  positions = svgMesh.positions
  /*
    1. scale: [x, y] -> scale * [x, y]
    2. set center: [0, 0] -> [0.5, 0.5] + alpha
  */
  positions = positions.map(function(p) {
    return [ p[0]*scale, p[1]*scale ]
  })
  var svgPositions = []
  window.mickeys.forEach( function (mickey) {
    var uv = convertCanvasToUv(mickey.position)
    var pos = positions.map(function(p) {
      return [ p[0]+uv[0], p[1]+uv[1] ]
    })
    svgPositions.push(pos)
  })
  return svgPositions
}

function getNewMesh (geometry) {
  var ng = new THREE.Geometry()
  geometry.computeFaceNormals()
  geometry.computeVertexNormals()
  // ng = new THREE.Geometry();

  for (var i=0; i<geometry.uniq.length; i++) {
    var v = geometry.uniq[i];
    var vertex_normal = new THREE.Vector3();
    var normals = [];
    for (var j=0; j<v.faces.length; j++) {
      var index = v.faces[j];
      var face = geometry.faces[index];
      var normal = face.normal;
      vertex_normal.add(normal);
      normals.push(normal);
    }
    vertex_normal.divideScalar(v.faces.length).normalize();
    geometry.uniq[i].vertex_normal = vertex_normal;
  }

  window.overlapIndex = []
  var svgPositions = getSvgPositions()
  hoge(svgPositions)
}

var nm
function replaceObject (geometry) {
  getNewMesh(geometry)

  // updateMesh(ng)
  // window.finishSubtract = true
}

var finishSubtract

function updateMesh (ng) {
  scene.remove(mesh)
  scene.remove(dm)
  scene.remove(cm)
  scene.remove(sm)
  scene.remove(texture)
  scene.remove(nm)

  console.log('done')
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: THREE.FaceColors,
    wireframe: true
  })
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
  nm.scale.x = mesh.scale.x
  nm.scale.y = mesh.scale.y
  nm.scale.z = mesh.scale.z
  scene.add(nm)
}

var bump = true
var bnd_points
var bnd_normals
var bnd_2d
var bnd_faces = []
var outer_faces = []



function showBndPoints () {
  var g = new THREE.Geometry()
  bnd_points = _.uniq(bnd_points)
  for (var i=0; i<num; i++) {
    if (!bnd_points[i]) continue
    g.vertices.push(bnd_points[i])
  }
  showPoints(g)
  num++
}




// function uvTo3D (nuv, ouv, va, vb, vc) {

//   return nxyz;
// }




