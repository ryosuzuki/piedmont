import THREE from 'three'
import FileSaver from 'file-saver'

import Geometry from './geometry'
import STLExporter from './three/stl-exporter'
import ThreeCSG from './three/three-csg'
import SvgToShape from './three/svg-to-shape'

import HollowGeometry from './hollow-geometry'

class Mesh extends THREE.Mesh {
  constructor (app) {
    super()
    this.app = app

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

  initialize () {
    this.loadImage()
    this.geometry = new Geometry()
    this.geometry.file = this.app.file
    this.geometry.get()
    this.geometry.load()
    this.updateMorphTargets()
    this.position.setY(-this.geometry.boundingBox.min.y)
    this.original = this.geometry.clone()
    this.originalMesh = new THREE.Mesh(this.original, this.material)
    this.originalMesh.position.setY(-this.geometry.boundingBox.min.y)
    this.dynamic = true;
    this.castShadow = true;
    this.app.scene.add(this)
    this.getSelectIndex()
    if (_.includes(['', 'cone'], this.app.model) === false) {
      this.rotateX(-Math.PI/2)
    }
  }

  computeNewMesh () {
    if (this.app.model === 'grip') {
      this.textureType = 'BUMP'
      this.computeBumpMesh()
      return false
    }
    if (this.app.model === 'house') {
      this.textureType = 'BUMP'
    }
    this.computeHollowMesh()
  }

  computeBumpMesh () {
    this.app.pattern.computeSvgMeshPositions()
    const json = {
      model: this.app.model,
      type: this.textureType,
      action: 'bump',
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

  computeHollowMesh () {
    this.items = []
    for (let i=0; i<this.app.pattern.items.length; i++) {
      let item = this.app.pattern.items[i]
      item.uv = this.app.convertCanvasToUv(item.bounds.center)
      let center = this.app.convertUvTo3d(item.uv)
      if (!center) continue
      let hash = {}
      hash.center = center.vertex
      hash.normal = center.normal

      if (this.app.model === 'house') {
        let face = this.geometry.faces[2506]
        hash.normal = face.normal
      }
      this.items.push(hash)
    }
    const json = {
      model: this.app.model,
      type: this.textureType,
      action: 'hollow',
      text: this.geometry.text,
      items: this.items,
      position: this.position,
      pathData: this.app.paint.path.pathData
    }

    if (false) {
      this.unit = SvgToShape.transform(json.pathData)
      for (let i=0; i<this.items.length; i++) {
        let item = this.items[i]
        let x = item.center.x + this.position.x
        let y = item.center.y + this.position.y
        let z = item.center.z + this.position.z
        let center = new THREE.Vector3(x, y, z)
        let normal = new THREE.Vector3(item.normal.x, item.normal.y, item.normal.z)
        let vec = new THREE.Vector3()
        let scalar = 10 // (this.type === 'HOLLOW') ? 10 : 1
        let start = vec.clone().addVectors(
          center,
          normal.clone().multiplyScalar(-scalar)
        )
        let end = vec.clone().addVectors(
          center,
          normal.clone().multiplyScalar(scalar)
        )
        let spline = new THREE.CatmullRomCurve3([start, end]);
        let extrudeSettings = { amount: 1, bevelEnabled: false, extrudePath: spline };
        let geometry = new THREE.ExtrudeGeometry(this.unit, extrudeSettings);
        geometry.normalize()
        let scale = 0.05 // this.size
        geometry.scale(scale, scale, scale)
        item.mesh = new THREE.Mesh(geometry, this.material)
        item.mesh.position.set(x, y+0.428, z-0.428) // 0, 0.96, 0
        item.mesh.rotateX(-Math.PI/2)
        this.app.scene.add(item.mesh)
        this.items[i] = item
      }
      return false
    }

    if (app.debugging) {
      let hollowGeometry = new HollowGeometry()
      hollowGeometry.model = json.model
      hollowGeometry.text = json.text
      hollowGeometry.items = json.items
      hollowGeometry.type = json.type
      hollowGeometry.pathData = json.pathData
      hollowGeometry.position = json.position
      hollowGeometry.load()
      hollowGeometry.generate()
      this.nm = hollowGeometry.itemMeshCSG.toMesh()
      this.app.scene.add(this.nm)
      this.cm = hollowGeometry.meshCSG.toMesh()
      this.app.scene.add(this.cm)
      return false
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

  getSelectIndex () {
    switch (this.app.model) {
      case 'house':
        this.selectIndex = [1847, 1849, 1850, 2502, 2503, 2504, 2505, 2506, 2507, 2508, 2530, 2531] //, 1804, 1805, 1844, 1845, 1846, 1848, 1862, 1863, 1864, 1865, 1869, 1870, 1871, 2499, 2500, 2501, 2525, 2526]
        break
      case 'grip':
        this.selectIndex = [249, 244, 331, 265, 336, 264, 250, 263, 252, 262, 344, 261, 346, 260, 230, 297, 233, 296, 234, 295, 255, 292, 349, 259, 350, 258, 256, 240, 248, 239, 352, 282, 360, 277, 208, 373, 210, 371, 251, 257, 253, 276, 254, 275, 318, 272, 319, 368, 320, 317, 321, 243, 323, 245, 322, 311, 324, 308, 246, 242, 247, 266, 325, 241]
        break
      default:
        const epsilon = 0.001
        this.selectIndex = []
        let vec = new THREE.Vector3(0, 1, 0)
        for (let i=0; i<this.geometry.faces.length; i++) {
          let face = this.geometry.faces[i]
          if (Math.abs(face.normal.dot(vec)) === 1) continue
          this.selectIndex.push(i)
        }
        break
    }
    this.selectFaceVertexUvs()
  }

  selectFaceVertexUvs () {
    for (let i=0; i<this.geometry.faces.length; i++) {
      if (_.includes(this.selectIndex, i)) continue
      this.geometry.faceVertexUvs[0][i] = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0)
      ]
    }
  }

  getSimilarFace () {
    if (this.app.model === 'house') {
      this.getSimilarHouseFace()
    } else if (this.app.model === 'grip') {
      this.getSimilarGripFace()
    }
    this.showSimilarFace()
  }

  getSimilarGripFace (epsilon) {
    if (!epsilon) epsilon = 0.1
    if (!this.geometry.uniq) this.geometry.computeUniq()
    var face = this.app.current.face
    var a = this.geometry.uniq[face.a]
    var b = this.geometry.uniq[face.b]
    var c = this.geometry.uniq[face.c]

    this.faces = [this.app.current.faceIndex]
    var queue = [this.app.current.faceIndex]
    var finished = []
    while (queue.length > 0) {
      var faceIndex = queue.shift()
      var currentFace = this.geometry.faces[faceIndex]

      var a = this.geometry.uniq[this.geometry.map[currentFace.a]]
      var b = this.geometry.uniq[this.geometry.map[currentFace.b]]
      var c = this.geometry.uniq[this.geometry.map[currentFace.c]]
      var faceAB = _.pull(_.intersection(a.faces, b.faces), faceIndex)
      var faceBC = _.pull(_.intersection(b.faces, c.faces), faceIndex)
      var faceCA = _.pull(_.intersection(c.faces, a.faces), faceIndex)
      var nextFaces = _.union(faceAB, faceBC, faceCA)

      var cos = nextFaces.map( function (index) {
        var nextFace = this.geometry.faces[index]
        return currentFace.normal.dot(nextFace.normal)
      }.bind(this))
      for (var i=0; i<3; i++) {
        var cos_a = cos[i]
        var cos_b = cos[(i+1)%3]
        var cos_c = cos[(i+2)%3]
        var bool = Math.abs(cos_a-1) < epsilon
                || Math.abs(cos_a-cos_b) < epsilon
                || Math.abs(cos_a-cos_c) < epsilon
        if (bool) {
          if (!finished.includes(nextFaces[i])) {
            queue = _.union(queue, [nextFaces[i]])
          }
          this.faces.push(nextFaces[i])
        }
      }
      this.faces = _.uniq(this.faces)
      finished.push(faceIndex)
    }
  }

  showSimilarFace() {
    this.sg = new THREE.Geometry()
    for (let i=0; i<this.faces.length; i++) {
      let index = this.faces[i]
      let face = this.geometry.faces[index]
      var num = this.sg.vertices.length
      this.sg.vertices.push(this.geometry.vertices[face.a])
      this.sg.vertices.push(this.geometry.vertices[face.b])
      this.sg.vertices.push(this.geometry.vertices[face.c])
      this.sg.faces.push(new THREE.Face3(num, num+1, num+2))
    }
    this.sm = new THREE.Mesh(this.sg, new THREE.MeshLambertMaterial({
      color: '#f00',
      vertexColors: THREE.FaceColors,
    }))
    this.sm.position.setY(this.position.y)
    this.app.scene.add(this.sm)
    this.app.scene.remove(this)
  }

  getSimilarHouseFace () {
    const epsilon = 0.01
    let currentFace = this.app.current.face
    if (!this.faces) this.faces = []
    var ng = new THREE.Geometry()
    for (let i=0; i<this.geometry.faces.length; i++) {
      let face = this.geometry.faces[i]
      let diff = currentFace.normal.dot(face.normal)
      if (Math.abs(1 - diff) < epsilon) {
        this.faces.push(i)
        console.log(diff, i)
      }
    }
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

    this.originalMesh = new THREE.Mesh(this.original, this.material)
    // this.app.scene.add(this.originalMesh)
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

  export () {
    let exporter = new STLExporter();
    let stlString = exporter.parse(this)
    let blob = new Blob([stlString], {type: 'text/plain'});
    FileSaver.saveAs(blob, `${Date.now()}.stl`);
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


  */



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

  /*

  createBumpMesh () {
    console.log('Start createBumpMesh')
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      let x = item.center.x + this.position.x
      let y = item.center.y + this.position.y
      let z = item.center.z + this.position.z
      let center = new THREE.Vector3(x, y, z)
      let normal = new THREE.Vector3(item.normal.x, item.normal.y, item.normal.z)
      let vec = new THREE.Vector3()
      let scalar = (this.textureType === 'HOLLOW') ? 10 : 1
      let start = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(-scalar)
      )
      let end = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(scalar)
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
      if (this.app.model !== 'lamp') {
        this.meshCSG = this.meshCSG.subtract(this.innerMeshCSG)
      }
      console.log('Item mesh subtraction')
      this.meshCSG = this.meshCSG.subtract(this.itemMeshCSG)
    }
    this.geometry = this.meshCSG.toGeometry()
    this.geometry.computeFaceNormals()
    this.replace()
    this.app.finish = true
  }
  */

}

export default Mesh
