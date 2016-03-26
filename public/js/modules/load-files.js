function loadObj (url, callback) {
  var loader = new THREE.OBJLoader()
  loader.load(url, function ( object ) {
    var object = object.children[0].geometry
    var positions = object.attributes.position.array
    var geometry = convertPositionsToGeometry(positions)
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
