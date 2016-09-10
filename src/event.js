import THREE from 'three'

class Event {
  constructor (setup) {
    this.scene = setup.scene
    this.camera = setup.camera
    this.mouse = setup.mouse
    this.renderer = setup.renderer
    this.raycaster = setup.raycaster
    this.objects = setup.objects
  }
  mouseDown (event) {
    let intersects = this.getIntersects(event);
    console.log('hoge')
    if (intersects.length < 1) return false
    // if (!selectMode && !undoMode) return false;
    // window.current = intersects[0];
    // window.currentIndex = current.faceIndex
  }
  mouseMove (event) {

  }
  mouseUp (event) {

  }
  doubleClick (event) {

  }
  getIntersects (event) {
    event.preventDefault()
    try {
      this.mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
      this.mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;
      this.raycaster.setFromCamera( this.mouse, this.camera );
      let intersects = this.raycaster.intersectObjects([this.mesh]);
      return intersects
    } catch (err) {
      return []
    }
  }
  start () {
    window.addEventListener('mousedown', this.mouseDown.bind(this), false)
    window.addEventListener('mousemove', this.mouseMove.bind(this), false)
    window.addEventListener('mouseup', this.mouseUp.bind(this), false)
    window.addEventListener('dblclick', this.doubleClick.bind(this), false)
  }
}

export default Event
