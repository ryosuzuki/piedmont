import THREE from 'three'
import '../node_modules/three/examples/js/renderers/CanvasRenderer.js'
import '../node_modules/three/examples/js/controls/OrbitControls.js'
class Setup {
  constructor (options) {
    options = options || {}

    const w = Setup.WindowWidth // window.innerWidth
    const h = Setup.WindowHeight // window.innerHeight

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(70, w / h, 1, Number.MAX_SAFE_INTEGER)

    this.camera.position.set(10, 15, 100)
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
    this.renderer.setSize(w, h)
    this.renderer.shadowMapEnabled = true

    var geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10)
    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0, 0, 1)
    })
    var ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = THREE.Math.degToRad(-90)
    ground.receiveShadow = true
    this.scene.add(ground)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.25
    this.controls.enableZoom = true

    geometry = new THREE.BoxGeometry(10, 10, 10)
    var cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
      color: new THREE.Color(0, 1, 0),
      side: THREE.DoubleSide
    }))
    cube.position.y = 5
    cube.castShadow = true
    this.scene.add(cube)
    this.cube = cube

    var ambientLight = new THREE.AmbientLight('#666')
    this.scene.add(ambientLight)

    var pointLight1 = new THREE.PointLight('#ffffff')
    pointLight1.position.set(10, 20, 30)
    pointLight1.intensity = 0.8
    pointLight1.castShadow = true
    this.scene.add(pointLight1)

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
    this.renderer.render(this.scene, this.camera)
    this.animate()
    if (this.isAnimating) {
      requestAnimationFrame(this.render.bind(this))
    }
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



/*
var stats
var camera
var scene
var renderer
var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2()
var size = 1
var Point

$(function () {
  paper.setup('canvas')
  Point = paper.Point
  Path = paper.Path
  Q.fcall(init())
  .then(drawObjects())
  .then(createSvg())
  .then(animate())
})

function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.set(size*2, size*2, size*2)
  camera.lookAt(new THREE.Vector3(0, 3, 0))
  scene.add( camera )

  scene.add(new THREE.AmbientLight(0xccc))
  var light = new THREE.SpotLight(0xfff, 1.5)
  light.position.set(size*7, size*7, -size*7)
  light.castShadow = true
  light.shadow.camera.near = size*3
  light.shadow.camera.far = camera.far
  light.shadow.camera.fov = 70
  light.shadow.bias = -0.000222
  light.shadow.mapSize.width = 1024
  light.shadow.mapSize.height = 1024
  scene.add(light)
  spotlight = light

  var grid = new THREE.GridHelper(size*5, size/2)
  grid.position.y = 0.01
  grid.material.opacity = 0.25
  grid.material.transparent = true
  scene.add(grid)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setClearColor(0xf0f0f0)
  renderer.setSize( window.innerWidth, window.innerHeight )
  renderer.shadowMap.enabled = true
  document.getElementById('viewport').appendChild( renderer.domElement )

  controls = new THREE.OrbitControls( camera, renderer.domElement )
  controls.damping = 0.2
  controls.addEventListener( 'change', render )

  stats = new Stats()
  stats.domElement.style.position = 'absolute'
  stats.domElement.style.top = '10px'
  stats.domElement.style.right = '20px'
  stats.domElement.style.zIndex = 100
  document.getElementById('viewport').appendChild(stats.domElement)

}

function animate(){
  requestAnimationFrame(animate)
  render()
  stats.update()
}

function render() {
  // controls.update()
  renderer.clear()
  renderer.render(scene, camera)
}
*/
