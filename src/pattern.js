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

    this.items = []
    this.item = this.unit
    this.items.push(this.item)
    // for (let i=1; i<30; i++) {
    //   for (let j=1; j<30; j++) {
    //     let item = this.unit.clone()
    //     item.position = [10+(i-5)*30, 10+(j-5)*30]
    //     item.sendToBack();
    //     this.items.push(item)
    //   }
    // }
    this.update()

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
    if (this.app.item) {
      if (!this.app.current.pos.isInside(this.app.item.bounds)) {
        this.deselect()
      }
    } else {
      for (let i=0; i<this.items.length; i++) {
        let item = this.items[i]
        if (this.app.current.pos.isInside(item.bounds)) {
          this.app.item = item
          this.select()
          break
        }
      }
    }
  }

  select () {
    this.drawing.activate()
    this.app.item.fillColor = 'grey'
    this.update()
  }

  deselect () {
    this.drawing.activate()
    this.app.item.fillColor = 'black'
    this.app.item = null
    this.update()
  }

  move () {
    this.drawing.activate()
    this.app.item.position = [this.app.current.pos.x, this.app.current.pos.y]
    this.update()
  }

  scale () {
    this.drawing.activate()
    let size = this.app.current.distance / this.app.previous.distance
    if (isNaN(size)) return false
    this.items.forEach( function (item) {
      item.scale(size)
    })
    this.update()
  }

  rotate () {
    this.drawing.activate()
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
    this.items.forEach( function (item) {
      item.rotate(rotate)
    })
    this.update()
  }

  copy () {
    this.drawing.activate()
    let item = this.app.item.clone()
    item.position = [item.position.x+2, item.position.y]
    this.items.push(item)

    this.seeds = []
    this.seeds.push(this.app.item)
    this.seeds.push(item)

    this.deselect()
    this.app.item = item
    this.select()
    this.update()
  }

  repeat () {
    let item_0 = this.seeds[0]
    let item_1 = this.seeds[1]

    let pos_0 = new THREE.Vector2(item_0.position.x, item_0.position.y)
    let pos_1 = new THREE.Vector2(item_1.position.x, item_1.position.y)
    let unit = new THREE.Vector2()
    unit.subVectors(pos_1, pos_0).normalize()
    let dist = pos_1.distanceTo(pos_0)

    for (let i=-5; i<6; i++) {
      if (i === 0 || i === 1) continue
      this.drawing.activate()
      var pos = new THREE.Vector2()
      var vec = unit.clone().multiplyScalar(i*dist)
      pos.addVectors(pos_0, vec)

      let item = item_0.clone()
      item.position = [pos.x, pos.y]
      this.items.push(item)
      this.update()
    }
    this.seeds = []
  }

  update () {
    this.drawing.view.draw()
    this.app.mesh.replace('canvas')
  }

}

export default Pattern
