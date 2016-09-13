import THREE from 'three'
import '../node_modules/three/examples/js/loaders/OBJLoader.js'
import '../node_modules/three/examples/js/loaders/STLLoader.js'
import '../node_modules/three/examples/js/loaders/BinaryLoader.js'

import Geometry from './geometry'

class Mesh extends THREE.Mesh {
  constructor (app) {
    super()
    this.app = app
    this.file = '../data/cone.obj'
    this.imageFile = '/public/assets/bunny_1k.png'
    this.defaultMaterial = new THREE.MeshLambertMaterial({
      color: '#eee',
      vertexColors: THREE.FaceColors,
    });
    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: '#ff0',
      vertexColors: THREE.FaceColors,
      wireframe: true
    })
    this.material = this.defaultMaterial
    this.initialize()
  }

  initialize () {
    this.loadImage()
    this.loadGeometry()
    this.updateMorphTargets() // = new Mesh(this.geometry, this.material);
    this.geometry.verticesNeedUpdate = true;
    this.dynamic = true;
    this.castShadow = true;
    this.app.scene.add(this)
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
    this.geometry = geometry
    // this.geometry = computeUniq(geometry)
  }

  loadImage () {
    var loader = new THREE.TextureLoader();
    loader.load(this.imageFile, function (image) {
      this.uvImage = image
      this.uvImage.minFilter = THREE.LinearFilter;
      this.uvImage.wrapS = THREE.RepeatWrapping;
      this.uvImage.wrapT = THREE.RepeatWrapping;
      this.uvImage.needsUpdate = true
      this.uvMaterial = new THREE.MeshLambertMaterial({
        color: '#fff',
        map: this.uvImage,
        transparent: true,
      });
    }.bind(this));

  }

  replace (type) {
    switch (type) {
      case 'uv':
        this.material = this.uvMaterial
        break;
      case 'canvas':
        let canvas = document.getElementById('drawing')
        this.canvasImage = new THREE.Texture(canvas)
        this.canvasImage.flipY = false
        this.canvasImage.minFilter = THREE.LinearFilter
        this.canvasImage.needsUpdate = true
        // this.canvasImage.wrapS = THREE.RepeatWrapping;
        // this.canvasImage.wrapT = THREE.RepeatWrapping;
        this.canvasImage.magFilter = THREE.NearestFilter
        // this.canvasImage.repeat.set(2, 2);
        this.canvasMaterial = new THREE.MeshLambertMaterial({
          map: this.canvasImage,
          transparent: true
        });

        this.material = this.canvasMaterial
        break;
      case 'wire':
        this.material = this.wireMaterial
        break;
      default:
        this.material = this.defaultMaterial
        break;
    }
    this.app.scene.remove(this)
    this.updateMorphTargets()
    // this.mesh = new Mesh(this.geometry, this.material);
    // this.mesh.scale.set(mesh.scale.x, mesh.scale.y, mesh.scale.z)
    // cm.position.set(mesh.position.x, mesh.position.y, mesh.position.z)
    // cm.rotation.set(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z)
    this.app.scene.add(this);
  }

  computeNewMesh () {
    this.geometry.computeUniq()
    this.geometry.computeFaceNormals()
    this.geometry.computeVertexNormals()
    this.app.pattern.computeSvgPositions()

    window.overlapIndex = []
    let selectIndex = []
    for (let i=0; i<this.geometry.faces.length; i++) {
      selectIndex.push(i)
    }

    var json = {
      hole: false,
      svgPositions: this.app.pattern.svgPositions,
      geometry: this.geometry,
      selectIndex: selectIndex,
      faces: this.geometry.faces,
      faceVertexUvs: this.geometry.faceVertexUvs,
      vertices: this.geometry.vertices,
      uniq: this.geometry.uniq,
      map: this.geometry.map,
    }
    window.json = json
    // debugger
    var data = JSON.stringify(json)
    var worker = new Worker('/worker.js');
    worker.onmessage = function(event) {
      var data = event.data
      console.log(data);
      var g = data.ng
      this.original = this.geometry.clone()
      this.geometry = new Geometry()
      for (var i=0; i<g.faces.length; i++) {
        try {
          var a = g.vertices[g.faces[i].a]
          var b = g.vertices[g.faces[i].b]
          var c = g.vertices[g.faces[i].c]

          var va = new THREE.Vector3(a.x, a.y, a.z)
          var vb = new THREE.Vector3(b.x, b.y, b.z)
          var vc = new THREE.Vector3(c.x, c.y, c.z)

          var num = this.geometry.vertices.length
          this.geometry.vertices.push(va)
          this.geometry.vertices.push(vb)
          this.geometry.vertices.push(vc)
          this.geometry.faces.push(new THREE.Face3(num, num+1, num+2))
        }
        catch (err) {
          console.log(err)
          continue
        }
      }

      this.replace('wire')

    }.bind(this)
    worker.postMessage(data);
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
    var geometry = new Geometry()
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
