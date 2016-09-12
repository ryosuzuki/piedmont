import THREE from 'three'

const unit = 1

class Plane {
  constructor (app) {
    this.app = app
    this.rotateImageFile = '/public/assets/rotate.svg'
    this.scaleImageFile = '/public/assets/scale.svg'
    this.initialize()
  }

  initialize () {
    this.loadImage()
    this.geometry = new THREE.PlaneGeometry(0.6*unit, 0.6*unit, 10)
    this.material = new THREE.MeshLambertMaterial({
      color: '#00ffff',
      vertexColors: THREE.FaceColors,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.geometry.verticesNeedUpdate = true
    this.mesh.dynamic = true
    this.mesh.castShadow = true
    this.mesh.position.set(Infinity, Infinity, Infinity)
    this.app.scene.add(this.mesh)
  }

  loadImage () {
    let loader = new THREE.TextureLoader();
    loader.load(this.rotateImageFile, function (image) {
      this.rotateImage = image
      this.rotateImage.minFilter = THREE.LinearFilter;
      this.rotateImage.needsUpdate = true;
      this.rotateImage.wrapS = THREE.RepeatWrapping;
      this.rotateImage.wrapT = THREE.RepeatWrapping;
    }.bind(this))
    loader.load(this.scaleImageFile, function (image) {
      this.scaleImage = image
      this.scaleImage.minFilter = THREE.LinearFilter;
      this.scaleImage.needsUpdate = true;
      this.scaleImage.wrapS = THREE.RepeatWrapping;
      this.scaleImage.wrapT = THREE.RepeatWrapping;
    }.bind(this))
  }

  show () {
    let normal = this.app.current.face.normal
    let point = this.app.current.point
    let pos = point.clone().add(normal.clone().multiplyScalar(0.01))
    let axis = point.clone().add(normal)
    this.mesh.position.set(pos.x, pos.y, pos.z)
    this.mesh.lookAt(axis)
  }

  update () {　
    if (this.app.current && this.app.current.item) {
      let normal = this.app.current.face.normal
      let point = this.app.current.point
      let pos = point.clone().add(normal.clone().multiplyScalar(0.01))
      let axis = point.clone().add(normal)
      this.mesh.position.set(pos.x, pos.y, pos.z)
      this.mesh.lookAt(axis)
    } else {
      this.mesh.position.set(Infinity, Infinity, Infinity)
    }
  }

}

export default Plane