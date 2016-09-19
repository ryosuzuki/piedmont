import THREE from 'three'
import FileSaver from 'file-saver'

import Geometry from './geometry'
import STLExporter from './three/stl-exporter'
import ThreeCSG from './three/three-csg'
import SvgToShape from './three/svg-to-shape'

class Mesh extends THREE.Mesh {
  constructor (app) {
    super()
    this.app = app
    this.textureType = 'HOLLOW'

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
    this.geometry.file = this.file
    this.geometry.init()
    this.updateMorphTargets()
    this.geometry.verticesNeedUpdate = true;
    this.original = this.geometry.clone()
    this.dynamic = true;
    this.castShadow = true;
    this.app.scene.add(this)

    this.selectIndex = []
    for (let i=0; i<this.geometry.faces.length; i++) {
      this.selectIndex.push(i)
    }
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
    this.app.scene.add(this);
  }


  computeNewMesh () {
    this.computeHollowMesh()
  }

  computeHollowMesh () {
    let items = []
    for (let i=0; i<this.app.pattern.items.length; i++) {
      let item = this.app.pattern.items[i]
      item.uv = this.app.convertCanvasToUv(item.bounds.center)
      let center = this.app.convertUvTo3d(item.uv)
      if (!center) continue
      let hash = {}
      hash.center = center.vertex
      hash.normal = center.normal
      items.push(hash)
    }
    const json = {
      type: this.textureType,
      text: this.geometry.text,
      items: items,
      pathData: this.app.paint.path.pathData
    }
    const data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
      const data = event.data
      console.log(data);
      var geometry = data.ng
      this.showNewMesh(geometry)
    }.bind(this)
  }

  computeBumpMesh () {
    this.app.pattern.computeSvgMeshPositions()
    const json = {
      type: 'BUMP',
      text: this.geometry.text,
      selectIndex: this.selectIndex,
      svgMeshPositions: this.app.pattern.svgMeshPositions,
    }
    const data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
      const data = event.data
      console.log(data);
      var geometry = data.ng
      this.showNewMesh(geometry)
    }.bind(this)
  }

  showNewMesh (geometry) {
    this.ng = new Geometry()
    for (var i=0; i<geometry.faces.length; i++) {
      var a = geometry.vertices[geometry.faces[i].a]
      var b = geometry.vertices[geometry.faces[i].b]
      var c = geometry.vertices[geometry.faces[i].c]

      var va = new THREE.Vector3(a.x, a.y, a.z)
      var vb = new THREE.Vector3(b.x, b.y, b.z)
      var vc = new THREE.Vector3(c.x, c.y, c.z)

      var num = this.ng.vertices.length
      this.ng.vertices.push(va)
      this.ng.vertices.push(vb)
      this.ng.vertices.push(vc)
      this.ng.faces.push(new THREE.Face3(num, num+1, num+2))
    }

    this.geometry = this.ng
    this.geometry.computeFaceNormals()
    this.replace()
    this.app.finish = true
  }

  export () {
    let exporter = new STLExporter();
    let stlString = exporter.parse(this)
    let blob = new Blob([stlString], {type: 'text/plain'});
    FileSaver.saveAs(blob, `${Date.now()}.stl`);
  }


  extrude () {

    var path = this.app.paint.path.pathData
    this.shape = SvgToShape.transform(path)
    // this.shapeGeometry = this.shape.makeGeometry()

    // this.shapeGeometry.computeBoundingBox()
    // let max = this.shapeGeometry.boundingBox.max
    // let min = this.shapeGeometry.boundingBox.min
    // let width = max.x - min.x
    // let height = max.y - min.y

    // let itemWidth = this.app.pattern.item.bounds.width
    // let itemHeight = this.app.pattern.item.bounds.height
    // let itemMin = new Paper.Point(this.app.pattern.item.bounds)
    // let itemMax = new Paper.Point(itemMin.x + itemWidth, itemMin.y + itemHeight)
    // let itemCenter = this.app.pattern.item.bounds.center

    let uvCenter = this.app.convertCanvasToUv(itemCenter)
    // let uvMin = this.app.convertCanvasToUv(itemMin)
    // let uvMax = this.app.convertCanvasToUv(itemMax)

    let centerInfo = this.app.convertUvTo3d(uvCenter)
    // let minInfo = this.app.convertUvTo3d(uvMin)
    // let maxInfo = this.app.convertUvTo3d(uvMax)
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



}

export default Mesh
