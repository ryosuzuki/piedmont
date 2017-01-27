import THREE from 'three'
import './import'
import App from './app'
import Mesh from './mesh'
import Plane from './plane'
import Paint from './paint'
import Pattern from './pattern'

let canvas = document.getElementById('viewport')
let app = new App({ canvas: canvas })

app.start()
window.app = app


window.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}, false);

window.addEventListener('drop', (event) => {
  event.stopPropagation();
  event.preventDefault()
  const data = event.dataTransfer.getData('text')
  const file = event.dataTransfer.files[0]

  console.log(file)
  console.log(data)
  window.file = file

  const reader = new FileReader()
  reader.onload = (e) => {
    const buffer = e.target.result
    window.buffer = buffer
    $.ajax({
      method: 'POST',
      url: '/data',
      data: JSON.stringify({ text: buffer }),
      dataType: 'json',
      contentType: 'application/json'
    })
    .done((data) => {
      loadFile()
    })
  }
  reader.readAsText(file)

}, false)

const loadFile = () => {
  app.file = '/out.obj'

  app.mesh = new Mesh(app)
  app.plane = new Plane(app)
  app.paint = new Paint(app)
  app.pattern = new Pattern(app)
}
