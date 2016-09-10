import THREE from 'three'
import '../node_modules/three/examples/js/renderers/CanvasRenderer.js'
import '../node_modules/three/examples/js/renderers/Projector.js'
import '../node_modules/three/examples/js/controls/OrbitControls.js'
import '../node_modules/three/examples/js/libs/stats.min.js'

class Setup {
  constructor (options) {
    options = options || {}
    options.antialias = true
    options.alpha = true

    const width = Setup.WindowWidth
    const height = Setup.WindowHeight
    const unit = 1

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(70, width / height, 1, Number.MAX_SAFE_INTEGER)
    this.camera.position.set(unit*2, unit*2, unit*2)
    this.scene.add(this.camera)

    this.lookAt = new THREE.Object3D()
    this.scene.add(this.lookAt)
    this.lookAt.add(this.camera)
    this.camera.lookAt(this.lookAt.position)

   if (Setup.isWebglAvailable()) {
      this.renderer = new THREE.WebGLRenderer(options)
    } else {
      this.renderer = new THREE.CanvasRenderer(options)
    }
    this.renderer.setClearColor('#eee')
    this.renderer.setSize(width, height)

    let grid = new THREE.GridHelper(unit*5, unit/2);
    grid.position.y = 0.01;
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    this.scene.add(grid);
    this.grid = grid

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.rotateSpeed = 0.3
    this.controls.zoomSpeed = 0.3
    this.controls.panSpeed = 0.3
    this.controls.damping = 0.2;
    this.controls.dampingFactor = 0.25
    this.controls.enableZoom = true

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    let ambientLight = new THREE.AmbientLight('#999')
    this.scene.add(ambientLight)

    let pointLight = new THREE.PointLight('#fff')
    pointLight.position.set(10, 20, 30)
    pointLight.intensity = 0.8
    pointLight.castShadow = true
    this.scene.add(pointLight)

    let directionalLight = new THREE.DirectionalLight('#fff', 0.2)
    directionalLight.position.set(4*unit, 4*unit, 7*unit)
    this.scene.add(directionalLight);

    let directionalLight2 = new THREE.DirectionalLight('#fff', 0.2)
    directionalLight2.position.set(-7*unit, -4*unit, -4*unit);
    this.scene.add(directionalLight2);

    let headLight = new THREE.PointLight('#fff', 0.25);
    this.scene.add(headLight);

    let spotLight = new THREE.SpotLight('#fff', 1.5);
    spotLight.position.set(unit*7, unit*7, -unit*7);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = unit*3;
    spotLight.shadow.camera.far = this.camera.far;
    spotLight.shadow.camera.fov = 70;
    spotLight.shadow.bias = -0.000222;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    this.isAnimating = true
  }
  static isWebglAvailable () {
    try {
      var canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext
        && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
    } catch (e) {
      return false
    }
  }
  static get WindowWidth () {
    return top.innerWidth
  }
  static get WindowHeight () {
    return top.innerHeight
  }
  start () {
    this.isAnimating = true
    this.render()
  }
  stop () {
    this.isAnimating = false
  }
  render () {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera)
    this.animate()
    if (this.isAnimating) {
      requestAnimationFrame(this.render.bind(this))
    }
  }
  animate () {
  }
  setCameraFOV (fov, z) {
    this.camera.fov = fov
    this.camera.position.z = z || this.camera.position.z
    this.camera.updateProjectionMatrix()
  }
}

export default Setup

