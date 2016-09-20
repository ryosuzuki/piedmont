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

    if (_.includes(['lamp', 'speaker'], this.app.model)) {
      this.textureType = 'HOLLOW'
    } else {
      this.textureType = 'BUMP'
    }

    this.worker = new Worker('./worker.js');
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

  computeNewMesh () {
    switch (this.app.model) {
      case 'house':
        this.size = 0.1
        break
      case 'speaker':
        this.size = 0.12
        break
      default:
        this.size = 0.1
        break
    }

    this.items = []
    for (let i=0; i<this.app.pattern.items.length; i++) {
      let item = this.app.pattern.items[i]
      item.uv = this.app.convertCanvasToUv(item.bounds.center)
      let center = this.app.convertUvTo3d(item.uv)
      if (!center) continue
      let hash = {}
      hash.center = center.vertex
      hash.normal = center.normal
      this.items.push(hash)
    }
    this.unit = SvgToShape.transform(this.app.pattern.unit.pathData)
    this.createBumpMesh()
  }

  showInnerMesh () {
    this.innerMesh = new THREE.Mesh(this.geometry, this.material)
    this.innerMesh.scale.set(0.9, 0.9, 0.9)
    let x = 0 + this.position.x
    let y = 0.05 + this.position.y
    let z = 0 + this.position.z
    this.innerMesh.position.set(x, y, z)
    this.app.scene.add(this.innerMesh)
    this.app.scene.remove(this)
  }

  createBumpMesh () {
    this.textureType = 'HOLLOW'
    console.log('Start createBumpMesh')
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      let x = item.center.x + this.position.x
      let y = item.center.y + this.position.y
      let z = item.center.z + this.position.z
      let center = new THREE.Vector3(x, y, z)
      let normal = new THREE.Vector3(item.normal.x, item.normal.y, item.normal.z)
      let vec = new THREE.Vector3()
      let start = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(-10)
      )
      let end = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(10)
      )
      let spline = new THREE.CatmullRomCurve3([start, end]);
      let extrudeSettings = { amount: 1, bevelEnabled: false, extrudePath: spline };
      let geometry = new THREE.ExtrudeGeometry(this.unit, extrudeSettings);
      geometry.normalize()
      item.mesh = new THREE.Mesh(geometry, this.defaultMaterial)
      item.mesh.position.set(x, y, z)
      let scale = this.size
      item.mesh.scale.set(scale, scale, scale)
      this.items[i] = item
    }

    console.log('Start createMeshCSG')
    this.meshCSG = new ThreeCSG(this)
    this.itemMeshCSG = new ThreeCSG(this.items[0].mesh)
    for (let i=1; i<this.items.length; i++) {
      console.log('Start updating meshCSG')
      let itemMeshCSG = new ThreeCSG(this.items[i].mesh)
      this.itemMeshCSG = this.itemMeshCSG.union(itemMeshCSG)
    }
    if (this.textureType === 'BUMP') {
      console.log('BUMP: Union the all CSG meshes')
      this.meshCSG = this.meshCSG.union(this.itemMeshCSG)
    } else {
      console.log('HOLLOW: Subtract the all CSG meshes')
      this.innerMesh = new THREE.Mesh(this.geometry, this.material)
      this.innerMesh.scale.set(0.9, 0.9, 0.9)
      let x = 0 + this.position.x
      let y = 0.05 + this.position.y
      let z = 0 + this.position.z
      this.innerMesh.position.set(x, y, z)
      this.innerMeshCSG = new ThreeCSG(this.innerMesh)
      console.log('Inner mesh subtraction')
      this.meshCSG = this.meshCSG.subtract(this.innerMeshCSG)
      console.log('Item mesh subtraction')
      this.meshCSG = this.meshCSG.subtract(this.itemMeshCSG)
    }
    this.geometry = this.meshCSG.toGeometry()
    this.geometry.computeFaceNormals()
    this.replace()
    this.app.finish = true
  }



  initialize () {
    this.loadImage()
    this.geometry = new Geometry()
    this.geometry.file = this.app.file
    this.geometry.init()
    this.updateMorphTargets()
    this.normalize()
    this.original = this.geometry.clone()
    this.originalMesh = new THREE.Mesh(this.original, this.material)

    this.dynamic = true;
    this.castShadow = true;
    this.app.scene.add(this)

    this.selectIndex = []
    for (let i=0; i<this.geometry.faces.length; i++) {
      this.selectIndex.push(i)
    }
  }

  createHollow () {
    this.outerMesh = this.originalMesh.clone()
    this.innerMesh = this.originalMesh.clone()
    this.innerMesh.scale.set(0.9, 0.9, 0.9)
    this.innerMesh.position.set(0, 0.1, 0)
    this.outerMeshCSG = new ThreeCSG(this.outerMesh)
    this.innerMeshCSG = new ThreeCSG(this.innerMesh)
    this.meshCSG = this.outerMeshCSG.subtract(this.innerMeshCSG)
    this.geometry = this.meshCSG.toGeometry()
  }

  normalize () {
    this.geometry.verticesNeedUpdate = true;
    this.geometry.normalize()
    this.geometry.rotateX(-Math.PI/2)
    this.geometry.computeBoundingBox()
    this.position.setY(-this.geometry.boundingBox.min.y)
  }

  loadImage () {
    var loader = new THREE.TextureLoader();
    loader.load(this.imageFile, function (image) {
      this.uvImage = image
      this.uvImage.minFilter = THREE.LinearFilter;
      // this.uvImage.wrapS = THREE.RepeatWrapping;
      // this.uvImage.wrapT = THREE.RepeatWrapping;
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

  /*
  computeNewMesh () {

    switch (this.app.model) {
      case 'house':
        this.size = 0.1
        break
      case 'speaker':
        this.size = 0.12
        break
      default:
        this.size = 0.1
        break
    }

    this.createEggMesh()

    if (this.app.model === 'house') {
      this.createEggMesh()
      // this.createHouseMesh()
    } else if (this.app.model === 'speaker') {
      this.createEggMesh()
    } else {
      this.computeBumpMesh()
    }
    if (this.textureType === 'BUMP') {
      this.computeBumpMesh()
    } else {
      this.computeHollowMesh()
    }
  }

  createHouseMesh () {
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

    let box = new THREE.BoxGeometry(0.1, 0.05, 0.05)
    for (let i=0; i<items.length; i++) {
      let item = items[i]
      let mesh = new THREE.Mesh(box, this.defaultMaterial)
      mesh.position.set(item.center.x, item.center.y, item.center.z)
      let angle = Math.atan(item.normal.y/item.normal.z)
      mesh.rotation.set(-angle, 0, 0)
      this.app.scene.add(mesh)
    }

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
      model: this.app.model,
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
  */

  computeBumpMesh () {
    this.app.pattern.computeSvgMeshPositions()
    const json = {
      model: this.app.model,
      type: this.textureType,
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
    this.normalize()
    this.replace()
    this.app.finish = true

    this.originalMesh = new THREE.Mesh(this.original, this.material)
    // this.app.scene.add(this.originalMesh)
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
