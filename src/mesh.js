import THREE from 'three'
import FileSaver from 'file-saver'

import Geometry from './geometry'
import Texture from './texture'
import STLExporter from './three/stl-exporter'
import ThreeCSG from './three/three-csg'
import SvgToShape from './three/svg-to-shape'

class Mesh extends THREE.Mesh {
  constructor (app) {
    super()
    this.app = app

    this.worker = new Worker('./worker.js');
    this.file = '/public/data/sphere.obj'
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
    this.geometry.file = this.file
    this.geometry.init()
    this.updateMorphTargets() // = new Mesh(this.geometry, this.material);
    this.geometry.verticesNeedUpdate = true;
    this.original = this.geometry.clone()
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

  extrude () {

    var path = this.app.paint.path.pathData
    this.shape = SvgToShape.transform(path)
    this.shapeGeometry = this.shape.makeGeometry()

    this.shapeGeometry.computeBoundingBox()
    let max = this.shapeGeometry.boundingBox.max
    let min = this.shapeGeometry.boundingBox.min
    let width = max.x - min.x
    let height = max.y - min.y

    let itemWidth = this.app.pattern.item.bounds.width
    let itemHeight = this.app.pattern.item.bounds.height
    let itemMin = new Paper.Point(this.app.pattern.item.bounds)
    let itemMax = new Paper.Point(itemMin.x + itemWidth, itemMin.y + itemHeight)
    let itemCenter = this.app.pattern.item.bounds.center

    let uvCenter = this.app.convertCanvasToUv(itemCenter)
    let uvMin = this.app.convertCanvasToUv(itemMin)
    let uvMax = this.app.convertCanvasToUv(itemMax)

    let centerInfo = this.app.convertUvTo3d(uvCenter)
    let minInfo = this.app.convertUvTo3d(uvMin)
    let maxInfo = this.app.convertUvTo3d(uvMax)
    let center = centerInfo.vertex
    let normal = centerInfo.normal

    this.centerInfo = centerInfo

    normal.xz = Math.sqrt(normal.x**2 + normal.z**2)
    var axisY = new THREE.Vector3(0, 1, 0)
    var rotateY = Math.atan(normal.z/normal.x)
    var axisXZ = new THREE.Vector3(-normal.z, 0, normal.x)
    var rotateXZ = Math.atan(normal.y/normal.xz)


    var scale = 1/220
    var thick = 0.1
    let vec = new THREE.Vector3()
    let start = vec.clone().addVectors(center, normal.clone().multiplyScalar(-thick))
    let end = vec.clone().addVectors(center, normal.clone().multiplyScalar(thick/scale))
    let points = [start, end]
    var spline = new THREE.CatmullRomCurve3(points);

    var extrudeSettings = { bevelEnabled: false, extrudePath: spline};
    var geometry = new THREE.ExtrudeGeometry(this.shape, extrudeSettings);
    this.shapeGeometry = new THREE.Mesh(geometry, this.defaultMaterial);
    this.shapeGeometry.scale.set(scale, scale, scale)
    this.shapeGeometry.position.set(start.x, start.y, start.z)
    this.shapeGeometry.rotateOnAxis(normal, 3*Math.PI/2)
    // this.shapeGeometry.rotateOnAxis(axisXZ, rotateXZ)
    // this.app.scene.add(this.shapeGeometry);
  };


  computeNewMesh () {
    this.extrude()
    let geometry = new ThreeCSG(this.geometry)
    let mesh2 = new THREE.Mesh(this.geometry, this.defaultMaterial)
    mesh2.scale.set(0.9, 0.9, 0.9)
    mesh2.position.set(0, 0.1, 0)
    let geometry2 = new ThreeCSG(mesh2)
    let result = geometry.subtract(geometry2)
    let shape = new ThreeCSG(this.shapeGeometry)
    result = result.subtract(shape)
    this.geometry = result.toGeometry()
    // this.app.scene.remove(this.shapeGeometry)
    this.geometry.computeFaceNormals()
    this.replace()

    this.app.finish = true
    return false

    this.app.pattern.computeSvgMeshPositions()
    let selectIndex = []
    for (let i=0; i<this.geometry.faces.length; i++) {
      selectIndex.push(i)
    }
    var json = {
      enableCover: false,
      svgMeshPositions: this.app.pattern.svgMeshPositions,
      selectIndex: selectIndex,
      text: this.geometry.text,
    }

    var data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
      var data = event.data
      console.log(data);
      var g = data.ng
      this.texture = new Texture()
      for (var i=0; i<g.faces.length; i++) {
        try {
          var a = g.vertices[g.faces[i].a]
          var b = g.vertices[g.faces[i].b]
          var c = g.vertices[g.faces[i].c]

          var va = new THREE.Vector3(a.x, a.y, a.z)
          var vb = new THREE.Vector3(b.x, b.y, b.z)
          var vc = new THREE.Vector3(c.x, c.y, c.z)

          var num = this.texture.vertices.length
          this.texture.vertices.push(va)
          this.texture.vertices.push(vb)
          this.texture.vertices.push(vc)
          this.texture.faces.push(new THREE.Face3(num, num+1, num+2))
        }
        catch (err) {
          console.log(err)
          continue
        }
      }

      this.geometry = this.texture
      this.geometry.computeFaceNormals()
      this.replace()
      this.app.finish = true
    }.bind(this)
  }

  export () {
    let exporter = new STLExporter();
    let stlString = exporter.parse(this)
    let blob = new Blob([stlString], {type: 'text/plain'});
    FileSaver.saveAs(blob, `${Date.now()}.stl`);
  }


}

export default Mesh
