var stats;
var camera;
var scene;
var renderer;
var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2();
var size = 1
var socket = io()

$(function () {
  init();
  drawGeometry();
  animate();

  originalPaper = new paper.PaperScope()
  originalPaper.setup($("#original")[0])
  originalPaper.view.center = [0, 0]

  drawingPaper = new paper.PaperScope()
  drawingPaper.setup($("#drawing")[0])
  drawingPaper.view.center = [0, 0]


  getTextureImage()

});

var i = 0;
function updateOriginal (path) {
  console.log('updateOriginal')


    // drawingPaper.activate()
    // var myCircle = new paper.Path.Circle(new paper.Point(0, 0), i);
    // myCircle.fillColor = 'black';
    // drawingPaper.view.draw()
    // i++

  drawingPaper.activate()
  var path = new paper.Path(path.pathData)
  path.scale(1/5)
    path.strokeColor = 'black'
    path.fillColor = 'black'
    path.closed = true
    // path.scale()
    path.position = [0, 0]

    window.mickey = path
    window.mickeys = [window.mickey]


  drawingPaper.view.draw()
}

function getTextureImage () {
  var loader = new THREE.TextureLoader();
  loader.load('/public/assets/bunny_1k.png', function (image) {
    image.minFilter = THREE.LinearFilter;
    image.needsUpdate = true;
    image.wrapS = THREE.RepeatWrapping;
    image.wrapT = THREE.RepeatWrapping;
    // image.repeat.set(4, 4);
    window.image = image;
  });

  loadSvg('/public/assets/mickey-2.svg', function (err, svg) {
  originalPaper.activate()

    var paper = originalPaper
    var d = $('path', svg).attr('d');
    var path = new paper.Path(d)
    path.strokeColor = 'black'
    path.fillColor = 'black'
    path.closed = true
    path.position = [0, 0]
    window.scale = 1/50

    // window.scale = 1/50
    path.scale(1/5)
    paper.view.draw()

    updateOriginal(path)


  originalPaper.activate()
  var tool = new paper.Tool();

  draft = new paper.Path(pathStyle);
  window.paint = function (current) {
    // var x = 700 * (current.uv.x + 0.5)
    // var y = 700 * (current.uv.y + 0.5)
    var x = current.uv.x
    var y = current.uv.y
    var point = new paper.Point(x, y);
    draft.add(point);
  }

  tool.onMouseDown = function (event) {
    if (draft) {
      draft.selected = false;
    }
    draft = new paper.Path(pathStyle);
    draft.segments = [event.point];
    start = event.point;
  }

  tool.onMouseDrag = function (event) {
    draft.add(event.point);
  }

  tool.onMouseUp = function(event) {
    var segmentCount = draft.segments.length;
    draft.simplify(10);
    var newSegmentCount = draft.segments.length;
    var difference = segmentCount - newSegmentCount;
    var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    end = event.point;

    draft.strokeColor = 'black'
    draft.fillColor = 'black'
    draft.closed = true

    updateOriginal(draft)
  }



  })
}


function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01*size, 1000);
  camera.position.set(size*2, size*2, size*2)
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add( camera );

  scene.add(new THREE.AmbientLight(0xccc));
  var ambientLight = new THREE.AmbientLight(0x999999);
  scene.add(ambientLight);
  var light = new THREE.DirectionalLight(0xFFFFFF, 0.2);
  light.position.set(4*size, 4*size, 7*size);
  scene.add(light);
  var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.2);
  light2.position.set(-7*size, -4*size, -4*size);
  scene.add(light2);

  var headLight = new THREE.PointLight(0xFFFFFF, 0.25);
  scene.add(headLight);

  // var light = new THREE.SpotLight(0xffffff, 1.5);
  // light.position.set(size*7, size*7, -size*7);
  // light.castShadow = true;
  // light.shadow.camera.near = size*3;
  // light.shadow.camera.far = camera.far;
  // light.shadow.camera.fov = 70;
  // light.shadow.bias = -0.000222;
  // light.shadow.mapSize.width = 1024;
  // light.shadow.mapSize.height = 1024;
  // scene.add(light);
  spotlight = light;

  var grid = new THREE.GridHelper(size*5, size/2);
  grid.position.y = 0.01;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  renderer = new THREE.WebGLRenderer({alpha: true, antialias: true });
  // renderer.setClearColor(0xbbbbbb, 1.0);
  renderer.setClearColor(0xf0f0f0);
  renderer.setSize( window.innerWidth, window.innerHeight );
  // renderer.shadowMap.enabled = true;
  document.getElementById('viewport').appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.damping = 0.2;
  controls.addEventListener( 'change', render );
  controls.rotateSpeed = 0.3
  controls.zoomSpeed = 0.3
  controls.panSpeed = 0.3

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '10px';
  stats.domElement.style.right = '20px';
  stats.domElement.style.zIndex = 100;
  document.getElementById('viewport').appendChild(stats.domElement);
  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseDown, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('touchstart', onDocumentTouchStart, false);

  window.addEventListener('resize', onWindowResize, false);
}

function animate(){
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  // controls.update();
  renderer.clear();
  renderer.render(scene, camera);
}
