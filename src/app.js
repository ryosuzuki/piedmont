import THREE from 'three'
import PointInTriangle from 'point-in-triangle'

import Mesh from './mesh'
import Plane from './plane'
import Paint from './paint'
import Pattern from './pattern'
import OrbitControls from './three/orbit-controls'

import Face from './face'

const unit = 1

class App {
  constructor (options) {
    options = options || {}
    options.antialias = true
    options.alpha = true

    const width = App.WindowWidth
    const height = App.WindowHeight
    this.current = null
    this.mode = null
    this.count = 0
    this.finish = false
    this.file = '/public/data/simple-vase.obj'
    this.debugging = true

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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
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
    pointLight.intensity = 0.1
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
    $('#mode').text(this.mode)
    switch (this.mode) {
      case 'CONTROL':
        this.controls.enabled = true
        break;
      case 'DRAG':
        if (this.current) {
          this.mesh.material.color = new THREE.Color('gray')
        } else {
          this.mesh.material.color = new THREE.Color('white')
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
      case 'SCALE_INIT':
        this.controls.enabled = false
        break;
      case 'SCALE':
        this.controls.enabled = false
        break;
      case 'ROTATE_INIT':
        this.controls.enabled = false
        break;
      case 'ROTATE':
        this.controls.enabled = false
        break;
      default:
        this.controls.enabled = true
        this.mesh.material.color = new THREE.Color('white')
        break;
    }
  }

  update (event) {
    event.preventDefault()
    if (this.finish) return false

    this.mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;
    this.raycaster.setFromCamera( this.mouse, this.camera );
    let objects = [this.mesh]
    this.intersects = this.raycaster.intersectObjects(objects);
    if (this.intersects.length == 0) {
      this.current = null
      return false
    }

    this.previous = this.current
    this.current = this.intersects[0]
    this.current.pos = this.convertUvToCanvas(this.current.uv)
    this.current.center2d = this.convert3dTo2d(this.plane.mesh.position)
    this.current.point2d = this.convert3dTo2d(this.current.point)
    this.current.distance = this.convert2dToDistance(this.current.point2d)
    this.current.vector2d = this.convert2dToVector(this.current.point2d)

    this.pattern.detect()

    console.log(event.type)
    switch (event.type) {
      case 'mousedown':
        switch (this.mode) {
          case 'ROTATE_INIT':
            this.mode = 'ROTATE'
            break
          case 'SCALE_INIT':
            this.mode = 'SCALE'
            break
          default:
            if (this.item) this.mode = 'MOVE'
            break
        }
        break;
      case 'mousemove':
        switch (this.mode) {
          case 'ROTATE':
            this.pattern.rotate()
            break
          case 'SCALE':
            this.pattern.scale()
            break
          case 'MOVE':
            break
          default:
            break
        }
        break;
      case 'mouseup':
        switch (this.mode) {
          case 'ROTATE':
            this.mode = 'ROTATE_INIT'
            break
          case 'SCALE':
            this.mode = 'SCALE_INIT'
            break
          case 'MOVE':
            this.mode = null
            this.controls.restart()
            break
          default:
            break
        }
        break;
      case 'dblclick':
        if (this.item && this.current.pos.isInside(this.item.bounds)) {
          this.select = this.item
        } else {
          this.pattern.deselect()
          this.select = null;
          this.mode = null
        }
        if (this.select) {
          if (this.count === 0 ) {
            this.mode = 'SCALE_INIT'
            this.plane.replace('scale')
            this.count = 1
          } else {
            this.mode = 'ROTATE_INIT'
            this.plane.replace('rotate')
            this.count = 0
          }
        }
        this.plane.update()
        break;
      default:
        this.mode = null
        break;
    }
  }

  command () {
    event.preventDefault()
    console.log(event)

    if (!this.item) return false

    switch(event.code) {
      case 'KeyC':
        this.pattern.copy()
        break
      default:
        break
    }

  }

  listen () {
    this.paint.listen()
    document.addEventListener('mousedown', this.update.bind(this), false)
    document.addEventListener('mousemove', this.update.bind(this), false)
    document.addEventListener('mouseup', this.update.bind(this), false)
    document.addEventListener('dblclick', this.update.bind(this), false)

    Mousetrap.bind('command+c', this.command.bind(this), 'keydown')
    Mousetrap.bind('command+v', this.command.bind(this), 'keydown')
  }

  animate () {
  }

  convert2dToDistance (point2d) {
    return point2d.distanceTo(this.current.center2d)
  }

  convert2dToVector (point2d) {
    var vec = new THREE.Vector2()
    return vec.clone().subVectors(point2d, this.current.center2d).normalize()
  }

  convert3dTo2d (point) {
    let vector = new THREE.Vector3();
    let canvas = this.renderer.domElement;
    vector.set(point.x, point.y, point.z);
    this.mesh.updateMatrixWorld()
    vector.applyMatrix4( this.mesh.matrixWorld )
    vector.project( this.camera );
    vector.x = Math.round( (   vector.x + 1 ) * canvas.width  / 2 ),
    vector.y = Math.round( ( - vector.y + 1 ) * canvas.height / 2 );
    vector.z = 0;
    let pos = new THREE.Vector2(vector.x, vector.y)
    return pos
  }

  convertUvTo3d (uv) {
    let faceVertexUvs = this.mesh.geometry.faceVertexUvs[0]
    for (let i=0; i<faceVertexUvs.length; i++) {
      let faceVertexUv = faceVertexUvs[i]
      let triangle = faceVertexUv.map( (vec) => {
        return [vec.x, vec.y]
      })
      let inside = PointInTriangle(uv, triangle)
      console.log(inside)
      if (inside) {
        let face = this.mesh.geometry.faces[i]
        if (face instanceof Face === false) {
          this.mesh.geometry.computeFaceVertexNormals()
          face = this.mesh.geometry.faces[i]
        }
        return face.uvTo3D([uv])[0]
      }
    }
  }

  convertUvToCanvas (uv) {
    const width = this.pattern.drawing.view.viewSize.width
    const height = this.pattern.drawing.view.viewSize.height
    const x = (uv.x-0.5)*width
    const y = (uv.y-0.5)*height
    let position = new Paper.Point(x, y)
    return position
    // return [ (uv.x)*width, (uv.y)*height]
  }

  convertCanvasToUv (position) {
    var width = this.pattern.drawing.view.viewSize.width
    var height = this.pattern.drawing.view.viewSize.height
    return [ (position.x/width)+0.5, (position.y/height)+0.5 ]
  }


  setCameraFOV (fov, z) {
    this.camera.fov = fov
    this.camera.position.z = z || this.camera.position.z
    this.camera.updateProjectionMatrix()
  }
}

export default App

