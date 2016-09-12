import Paper from 'paper'

class Pattern {
  constructor (app) {
    this.app = app

    let drawing = document.getElementById('drawing')
    drawing.width = 256 // 1280 // 256
    drawing.height = 256 //1280 // 256

    this.drawing = new Paper.PaperScope()
    this.drawing.setup($('#drawing')[0])
    this.drawing.view.center = [0, 0]
    this.drawing.view.viewSize = [256, 256] // [1280, 1280] // new paper.Size(256, 256)
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
    this.unit.position = [30, 30]
    this.drawing.view.draw()

    this.item = this.unit
    this.items = [this.item]


    const drawing = this.app.pattern.drawing
    const size = drawing.view.size
    let rect = new Paper.Path.Rectangle({
      point: [-size.width, -size.height],
      size: [size.width, size.height],
      strokeColor: 'white',
      selected: true
    });
    rect.sendToBack();
    rect.fillColor = '#ff0000';
    drawing.view.draw()

    let rect2 = new Paper.Path.Rectangle({
      point: [-size.width, -size.height],
      size: [size.width*2, size.height*2],
      strokeColor: 'white',
      selected: true
    });
    rect2.sendToBack();
    rect2.fillColor = '#0000ff';
    drawing.view.draw()
  }

  detect () {
    if (this.app.current.pos.isInside(this.item.bounds)) {
      this.select()
    } else {
      this.deselect()
    }
  }

  select () {
    this.drawing.activate()
    this.item.fillColor = 'grey'
    this.app.current.item = this.item
    this.update()
  }

  deselect (id) {
    this.drawing.activate()
    this.item.fillColor = 'black'
    this.app.current.item = null
    this.update()
  }

  move () {
    this.drawing.activate()
    let pos = this.convertUvToCanvas(this.app.current.uv)
    this.item.position = [pos.x, pos.y]
    this.update()
  }

  scale (size) {
    size = size || 2
    this.drawing.activate()
    this.items.forEach( function (item) {
      item.scale(size)
    })
    this.update()
  }

  rotate (angle) {
    angle = angle || 90
    this.drawing.activate()
    this.items.forEach( function (item) {
      item.rotate(rotate)
    })
    this.update()
  }

  copy (uv) {
  }

  repeate () {
  }

  update () {
    this.drawing.view.draw()
    this.app.mesh.replace('canvas')
  }

  convertUvToCanvas (uv) {
    const width = this.drawing.view.viewSize.width
    const height = this.drawing.view.viewSize.height
    const x = (uv.x-0.5)*width
    const y = (uv.y-0.5)*height
    let pos = new Paper.Point(x, y)
    return pos
    // return [ (uv.x)*width, (uv.y)*height]
  }

  convertCanvasToUv (center) {
    var width = this.drawing.view.viewSize.width
    var height = this.drawing.view.viewSize.height
    return [ (center.x/width)+0.5, (center.y/height)+0.5 ]
  }

}

export default Pattern
