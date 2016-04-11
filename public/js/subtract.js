var objects = [];
var material = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  side: THREE.DoubleSide,
  wireframe: true,
})
material.color.set(new THREE.Color('black'))

var ng;
function go () {
  // window.scale = 1/55
  Q.fcall(computeUniq(geometry))
  .then(replaceObject(geometry))
}

function hoge (svgPositions) {
  // hole = true
  var json = {
    hole: hole,
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
    var data = event.data
    console.log(data);
    var g = data.ng
    ng = new THREE.Geometry()
    for (var i=0; i<g.faces.length; i++) {
      try {
        var a = g.vertices[g.faces[i].a]
        var b = g.vertices[g.faces[i].b]
        var c = g.vertices[g.faces[i].c]

        var va = new THREE.Vector3(a.x, a.y, a.z)
        var vb = new THREE.Vector3(b.x, b.y, b.z)
        var vc = new THREE.Vector3(c.x, c.y, c.z)

        var num = ng.vertices.length
        ng.vertices.push(va)
        ng.vertices.push(vb)
        ng.vertices.push(vc)
        ng.faces.push(new THREE.Face3(num, num+1, num+2))
      }
      catch (err) {
        console.log(err)
        continue
      }
    }
    updateMesh(ng)
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
  var s = window.scale / 5 // 25
  positions = positions.map(function(p) {
    return [ p[0]*s, p[1]*s ]
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

function restartMesh () {
  window.finishSubtract = false
  scene.remove(nm)
  scene.add(mesh)
  scene.add(dm)
  scene.add(cm)
  scene.add(sm)
  // scene.add(texture)
}

var nm
function replaceObject (geometry) {
  getNewMesh(geometry)

  // updateMesh(ng)
  window.finishSubtract = true
}

var finishSubtract

var wireMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  vertexColors: THREE.FaceColors,
  wireframe: true
})

function updateMesh (ng) {
  // scene.remove(mesh)
  scene.remove(dm)
  scene.remove(cm)
  scene.remove(sm)
  scene.remove(texture)
  scene.remove(nm)

  console.log('done')

  nm = new THREE.Mesh(ng, wireMaterial);
  // nm = THREE.SceneUtils.createMultiMaterialObject(ng, [
  //   material,
  //   wireMaterial
  // ])

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

var hole = false
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




