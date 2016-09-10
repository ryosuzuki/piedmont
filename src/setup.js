import THREE from 'three'
import '../node_modules/three/examples/js/renderers/CanvasRenderer.js'
import '../node_modules/three/examples/js/controls/OrbitControls.js'
import '../node_modules/three/examples/js/libs/stats.min.js'

class Setup {
  constructor (options) {
    options = options || {}
    options.antialias = true

    const width = Setup.WindowWidth // window.innerWidth
    const height = Setup.WindowHeight // window.innerHeight
    const size = 1

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(70, width / height, 1, Number.MAX_SAFE_INTEGER)
    this.camera.position.set(size*2, size*2, size*2)
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
    // this.renderer = new THREE.WebGLRenderer(options)
    this.renderer.setClearColor('#f0f0f0')
    this.renderer.setSize(width, height)
    this.renderer.shadowMap.enabled = true

    let grid = new THREE.GridHelper(size*5, size/2);
    grid.position.y = 0.01;
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    this.scene.add(grid);
    this.grid = grid

    // let geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10)
    // let material = new THREE.MeshLambertMaterial({
    //   color: new THREE.Color(0, 0, 1)
    // })
    // let ground = new THREE.Mesh(geometry, material)
    // ground.rotation.x = THREE.Math.degToRad(-90)
    // ground.receiveShadow = true
    // this.scene.add(ground)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.damping = 0.2;
    this.controls.dampingFactor = 0.25
    this.controls.enableZoom = true
    // this.controls.addEventListener( 'change', this.render() );

    // this.stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '10px';
    // stats.domElement.style.right = '20px';
    // stats.domElement.style.zIndex = 100;
    // document.getElementById('viewport').appendChild(this.stats.domElement);

    let geometry = new THREE.BoxGeometry(size, size, size)
    let cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
      color: new THREE.Color(0, 1, 0),
      side: THREE.DoubleSide
    }))
    cube.position.y = 0
    cube.castShadow = true
    this.scene.add(cube)
    this.cube = cube

    let ambientLight = new THREE.AmbientLight('#ccc')
    this.scene.add(ambientLight)

    let pointLight1 = new THREE.PointLight('#fff')
    pointLight1.position.set(10, 20, 30)
    pointLight1.intensity = 0.8
    pointLight1.castShadow = true
    this.scene.add(pointLight1)

    let spotLight = new THREE.SpotLight('#fff', 1.5);
    spotLight.position.set(size*7, size*7, -size*7);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = size*3;
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
    // this.animate()
    // if (this.isAnimating) {
    //   requestAnimationFrame(this.render.bind(this))
    // }
  }
  animate () {
    var deg = THREE.Math.radToDeg(this.lookAt.rotation.y)
    this.lookAt.rotation.y = THREE.Math.degToRad(deg - 0.2)
  }

  setCameraFOV (fov, z) {
    this.camera.fov = fov
    this.camera.position.z = z || this.camera.position.z
    this.camera.updateProjectionMatrix()
  }
}

export default Setup

