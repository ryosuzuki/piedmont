import THREE from 'three'
import '../node_modules/three/examples/js/exporters/STLExporter.js'

import FileSaver from 'file-saver'
import Geometry from './geometry'

class Mesh extends THREE.Mesh {
  constructor (app) {
    super()
    this.app = app

    this.worker = new Worker('./worker.js');
    this.file = '/public/data/cone.obj'
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
    this.geometry = new Geometry()
    this.geometry.load(this.file)
    this.updateMorphTargets() // = new Mesh(this.geometry, this.material);
    this.geometry.verticesNeedUpdate = true;
    this.dynamic = true;
    this.castShadow = true;
    this.app.scene.add(this)
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
      selectIndex: selectIndex,
      file: this.file,
      geometry: this.geometry,
      faces: this.geometry.faces,
      faceVertexUvs: this.geometry.faceVertexUvs,
      vertices: this.geometry.vertices,
      uniq: this.geometry.uniq,
      map: this.geometry.map,
    }
    window.json = json
    // debugger
    var data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
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
      this.app.finish = true
    }.bind(this)
  }

  export () {
    let exporter = new THREE.STLExporter();
    let stlString = exporter.parse(this)
    let blob = new Blob([stlString], {type: 'text/plain'});
    FileSaver.saveAs(blob, `${Date.now()}.stl`);
  }


}

export default Mesh
