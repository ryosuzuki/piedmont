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
    if (this.app.select) {
      this.select()
      return false
    }
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
    this.item.position = [this.app.current.pos.x, this.app.current.pos.y]
    this.update()
  }

  scale () {
    let size = this.app.current.distance / this.app.previous.distance
    if (isNaN(size)) return false
    this.drawing.activate()
    this.items.forEach( function (item) {
      item.scale(size)
    })
    this.update()
  }

  rotate () {
    try {
    let angle = Math.acos(this.app.current.vector2d.dot(this.app.previous.vector2d))
    let sign = (this.app.current.point2d.x - this.app.current.center2d.x)
      * (this.app.previous.point2d.y - this.app.current.center2d.y)
      - (this.app.current.point2d.y  - this.app.current.center2d.y)
      * (this.app.previous.point2d.x - this.app.current.center2d.x)
      > 0 ? 1 : -1
    if (isNaN(angle)) return true
    this.app.plane.mesh.rotateZ(sign*angle)
    // this.app.plane.mesh.material.map = this.app.plane.rotateImage
    let rotate = sign*angle*90/Math.PI
    this.drawing.activate()
    this.items.forEach( function (item) {
      item.rotate(rotate)
    })
    this.update()
    } catch (err) {
      console.log(err)
    }
  }

  copy (uv) {
  }

  repeate () {
  }

  update () {
    this.drawing.view.draw()
    this.app.mesh.replace('canvas')
  }

}

export default Pattern
