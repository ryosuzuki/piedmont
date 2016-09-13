import THREE from 'three'
import '../node_modules/three/examples/js/controls/OrbitControls.js'

class OrbitControls extends THREE.OrbitControls {
  constructor (object, domElement) {
    super(object, domElement)
  }

  restart () {
    state = STATE.NONE;
    this.dispose();

    this.domElement.addEventListener( 'contextmenu', contextmenu, false );
    this.domElement.addEventListener( 'mousedown', onMouseDown, false );
    this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
    this.domElement.addEventListener( 'MozMousePixelScroll', onMouseWheel, false ); // firefox
    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );

    window.addEventListener( 'keydown', onKeyDown, false );
    // force an update at start
    this.update();
  }
}

export default OrbitControls
