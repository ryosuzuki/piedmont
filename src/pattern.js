import Paper from 'paper'

class Pattern {
  constructor (app) {
    this.app = app

    let drawing = document.getElementById('drawing')
    drawing.width = 512 // 1280 // 256
    drawing.height = 512 //1280 // 256

    this.drawing = new Paper.PaperScope()
    this.drawing.setup($('#drawing')[0])
    this.drawing.view.center = [0, 0]
    this.drawing.view.viewSize = [512, 512] // [1280, 1280] // new paper.Size(256, 256)
  }

  initialize (path) {
    this.app.mesh.replace('canvas') // for debugging

    const scale = 0.2
    this.drawing.activate()
    this.unit = new Paper.Path(path.pathData)
    this.unit.scale(scale)
    this.unit.strokeColor = 'black'
    this.unit.fillColor = 'black'
    this.unit.rotate(180)
    this.unit.closed = true
    // this.unit.scale()
    this.unit.position = [0, 0]
    this.drawing.view.draw()

    this.item = this.unit
    this.items = [this.item]
  }

  scale (value) {
    const scale = value || 2
    this.drawing.activate()
    this.items.forEach( function (item) {
      item.scale(scale)
    })
    this.update()
  }

  rotate (value) {
    const rotate = value || 90
    this.drawing.activate()
    this.items.forEach( function (item) {
      item.rotate(rotate)
    })
    this.update()
  }

  move (value) {
    const uv = value || uv
    this.drawing.activate()
    window.currentUv = uv
    var center = convertUvToCanvas(uv)
    // nextMickey.position = center
    window.currentMickey.position = center
    this.update()
  }

  update () {
    this.drawing.view.draw()
    this.app.mesh.replace('canvas')
  }

}

export default Pattern
