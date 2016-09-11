function loadObj (url, callback) {
  var loader = new THREE.OBJLoader()
  loader.load(url, function ( object ) {
    var object = object.children[0].geometry
    var positions = object.attributes.position.array
    var geometry = convertPositionsToGeometry(positions)
    if (object.attributes.uv) {
      geometry = getInitialUv(object, geometry)
    }
    return callback(geometry)
  })
}

function loadStl (url, callback) {
  var loader = new THREE.STLLoader()
  loader.load(url, function ( res ) {
    var object = res
    var geometry
    if (object.vertices) {
      geometry = object
    } else {
      var positions = object.attributes.position.array
      geometry = convertPositionsToGeometry(positions)
    }
    return callback(geometry)
  })
}

function getInitialUv (object, geometry) {
  var mappings = object.attributes.uv.array
  var n = mappings.length/2
  for (var i=0; i<geometry.faces.length; i++) {
    var face = geometry.faces[i]
    var a = face.a
    var b = face.b
    var c = face.c
    var uv_a = new THREE.Vector2(mappings[2*a], mappings[2*a+1])
    var uv_b = new THREE.Vector2(mappings[2*b], mappings[2*b+1])
    var uv_c = new THREE.Vector2(mappings[2*c], mappings[2*c+1])
    geometry.faceVertexUvs[0][i] = [uv_a, uv_b, uv_c]
  }
  return geometry
}

function convertPositionsToGeometry (positions) {
  var n = positions.length/9
  var geometry = new THREE.Geometry()
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
    var num = geometry.vertices.length
    geometry.vertices.push(v1)
    geometry.vertices.push(v2)
    geometry.vertices.push(v3)
    geometry.faces.push(new THREE.Face3(num, num+1, num+2))
  }
  geometry.computeFaceNormals()
  return geometry
}
