import THREE from 'three'
import '../node_modules/three/examples/js/loaders/OBJLoader.js'
import '../node_modules/three/examples/js/loaders/STLLoader.js'
import '../node_modules/three/examples/js/loaders/BinaryLoader.js'

import computeUniq from './modules/uniq'


class Mesh {
  constructor (setup) {
    this.scene = setup.scene
    this.file = '../data/cone.obj'
    this.material = new THREE.MeshLambertMaterial({
      color: '#eee',
      vertexColors: THREE.FaceColors,
    });
    this.loadImage()
  }

  loadImage () {
    this.imageFile = '/public/assets/bunny_1k.png'
    var loader = new THREE.TextureLoader();
    loader.load(this.imageFile, function (image) {
      this.uvImage = image
      this.uvImage.minFilter = THREE.LinearFilter;
      this.uvImage.needsUpdate = true;
      this.uvImage.wrapS = THREE.RepeatWrapping;
      this.uvImage.wrapT = THREE.RepeatWrapping;
      this.uvMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: this.uvImage,
        transparent: true,
        opacity: 0.5
      });
      this.uvMaterial.map.minFilter = THREE.LinearFilter
      this.uvMaterial.map.needsUpdate = true
      this.showImage()
    }.bind(this));
  }

  showImage () {
    this.scene.remove(this.mesh)
    this.mesh = new THREE.Mesh(this.geometry, this.uvMaterial);
    // cm.scale.set(mesh.scale.x, mesh.scale.y, mesh.scale.z)
    // cm.position.set(mesh.position.x, mesh.position.y, mesh.position.z)
    // cm.rotation.set(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z)
    this.scene.add(this.mesh);
  }

  loadGeometry () {
    let objLoader = new THREE.OBJLoader()
    var req = new XMLHttpRequest();
    req.open('GET', this.file, false);
    req.send(null);
    let text = req.responseText
    let res = objLoader.parse(text)
    let object = res.children[0].geometry
    let positions = object.attributes.position.array
    let geometry = Mesh.convertPositionsToGeometry(positions)
    if (object.attributes.uv) {
      geometry = Mesh.getInitialUv(object, geometry)
    }
    this.geometry = computeUniq(geometry)
  }

  render () {
    this.loadGeometry()
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.geometry.verticesNeedUpdate = true;
    this.mesh.dynamic = true;
    this.mesh.castShadow = true;
    this.scene.add(this.mesh)
  }

  static getInitialUv (object, geometry) {
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

  static convertPositionsToGeometry (positions) {
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


}

export default Mesh
