import THREE from 'three'
import './libs/OrbitControls.js'

import Mesh from './mesh'
import Plane from './plane'
import Paint from './paint'
import Pattern from './pattern'

const unit = 1

class App {
  constructor (options) {
    options = options || {}
    options.antialias = true
    options.alpha = true

    const width = App.WindowWidth
    const height = App.WindowHeight
    this.current = null
    this.mesh = null
    this.mode = null

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(70, width / height, 1, Number.MAX_SAFE_INTEGER)
    this.camera.position.set(unit*3, unit*3, unit*3)
    this.scene.add(this.camera)

    this.lookAt = new THREE.Object3D()
    this.scene.add(this.lookAt)
    this.lookAt.add(this.camera)
    this.camera.lookAt(this.lookAt.position)

    this.renderer = new THREE.WebGLRenderer(options)
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
    pointLight.position.set(10*unit, 20*unit, 30*unit)
    pointLight.intensity = 0.3
    pointLight.castShadow = true
    this.scene.add(pointLight)

    let directionalLight = new THREE.DirectionalLight('#fff', 0.2)
    directionalLight.position.set(4*unit, 4*unit, 7*unit)
    this.scene.add(directionalLight);

    let directionalLight2 = new THREE.DirectionalLight('#fff', 0.2)
    directionalLight2.position.set(-7*unit, -4*unit, -4*unit);
    this.scene.add(directionalLight2);

    let spotLight = new THREE.SpotLight('#fff', 1.5);
    spotLight.position.set(unit*7, unit*7, -unit*7);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = unit*3;
    spotLight.shadow.camera.far = this.camera.far;
    spotLight.shadow.camera.fov = 70;
    spotLight.shadow.bias = -0.000222;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    // this.scene.add(spotLight);

    this.isAnimating = true
    this.isControl = true
  }

  static get WindowWidth () {
    return top.innerWidth
  }

  static get WindowHeight () {
    return top.innerHeight
  }

  start () {
    this.isAnimating = true
    this.mesh = new Mesh(this)
    this.plane = new Plane(this)
    this.paint = new Paint(this)
    this.pattern = new Pattern(this)
    this.listen()
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
    switch (this.mode) {
      case 'CONTROL':
        this.controls.enabled = true
        break;
      case 'DRAG':
        if (this.current) {
          this.mesh.mesh.material.color = new THREE.Color('gray')
        } else {
          this.mesh.mesh.material.color = new THREE.Color('white')
        }
        break;
      case 'DROP':
        if (this.current) {
          this.mesh.replace('canvas')
        }
        this.mode = null
        break;
      case 'MOVE':
        this.controls.enabled = false
        this.pattern.move()
        break;
      case 'COPY':
        this.controls.enabled = false
        copy()
        break;
      case 'SCALE':
        this.controls.enabled = false
        scale()
        break;
      case 'ROTATE':
        this.controls.enabled = false
        rotate()
        break;
      default:
        this.controls.enabled = true
        this.mesh.mesh.material.color = new THREE.Color('white')
        break;
    }
  }

  update (event) {
    this.mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;
    this.raycaster.setFromCamera( this.mouse, this.camera );
    let objects = [app.mesh.mesh]
    this.intersects = this.raycaster.intersectObjects(objects);
    if (this.intersects.length == 0) {
      this.current = null
      return false
    }

    this.current = this.intersects[0]
    this.current.pos = this.pattern.convertUvToCanvas(this.current.uv)
    this.pattern.detect()


    console.log(event.type)
    switch (event.type) {
      case 'dragstart':

        break;
      case 'dragend':
        this.mode = null
        break;
      case 'mousedown':
        if (this.current.item) {
          this.mode = 'MOVE'
        }
        break
      case 'mousemove':
        break
      case 'mouseup':
        this.mode = null
        this.controls.restart()
        break
      case 'dblclick':
        this.plane.update()
        break;
      default:
        this.mode = null
        break;
    }

  }

  listen () {
    this.paint.listen()
    document.addEventListener('mousedown', this.update.bind(this), false)
    document.addEventListener('mousemove', this.update.bind(this), false)
    document.addEventListener('mouseup', this.update.bind(this), false)
    document.addEventListener('dblclick', this.update.bind(this), false)
    document.addEventListener('dragstart', this.update.bind(this), false)
    document.addEventListener('drag', this.update.bind(this), false)
    document.addEventListener('dragend', this.update.bind(this), false)
  }

  scale () {
      if (!previous) window.previous = current
        var center2d = getScreenPosition(planeCanvas.position)
      var current2d = getScreenPosition(current.point)
      var previous2d = getScreenPosition(previous.point)

      var cd = current2d.distanceTo(center2d)
      var pd = previous2d.distanceTo(center2d)
      var scale = cd / pd
      scaleMickey(scale)
      window.previous = current
    // drawLine(pos.x, pos.y)
    // if (pos) showDrawingCanvas(pos)
  }
  rotate () {
    if (!previous) window.previous = current
      var center2d = getScreenPosition(planeCanvas.position)
    var current2d = getScreenPosition(current.point)
    var previous2d = getScreenPosition(previous.point)
    var v = new THREE.Vector2()
    var cv = v.clone().subVectors(current2d, center2d).normalize()
    var pv = v.clone().subVectors(previous2d, center2d).normalize()
    var angle = Math.acos(cv.dot(pv))
    var sign = (current2d.x - center2d.x) * (previous2d.y - center2d.y) - (current2d.y - center2d.y) * (previous2d.x - center2d.x) > 0 ? 1 : -1
    planeCanvas.rotateZ(sign*angle)
    rotateMickey(sign*angle*90/Math.PI)
    planeCanvas.material.map = rotateImage

    var result = getSingedAngle(center2d, current2d, previous2d)
    var sign = result.sign
    var angle = result.angle
    planeCanvas.rotateZ(sign*angle)
    rotateMickey(sign*angle*90/Math.PI)
    planeCanvas.material.map = rotateImage
    window.previous = current
  }

  animate () {
  }

  setCameraFOV (fov, z) {
    this.camera.fov = fov
    this.camera.position.z = z || this.camera.position.z
    this.camera.updateProjectionMatrix()
  }
}

export default App

