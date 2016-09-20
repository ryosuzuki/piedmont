import Paper from 'paper'
import SvgMesh3d from 'svg-mesh-3d'


class Pattern {
  constructor (app) {
    this.app = app

    this.resolution = 10
    this.size = 256 * this.resolution
    let drawing = document.getElementById('drawing')
    drawing.width = this.size // 1280 // 256
    drawing.height = this.size //1280 // 256

    this.drawing = new Paper.PaperScope()
    this.drawing.setup($('#drawing')[0])
    this.drawing.view.center = [0, 0]
    this.drawing.view.viewSize = [this.size, this.size] // [1280, 1280] // new paper.Size(256, 256)
    this.repeatCount = 0
  }

  initialize (path) {
    if (this.app.debugging) {
      this.app.mesh.replace('canvas') // for debugging
    }

    const scale = 0.2 * this.resolution
    this.drawing.activate()
    this.unit = new Paper.Path(path.pathData)
    this.unit.scale(scale)
    this.unit.strokeColor = 'black'
    this.unit.fillColor = 'black'
    this.unit.rotate(180)
    this.unit.closed = true
    // this.unit.scale()
    switch (this.app.model) {
      case 'house':
        this.unit.position = [0, 0]
        break
      case 'lamp':
        this.unit.position = [0, 0]
        break
      default:
        this.unit.position = [50*this.resolution, 50*this.resolution]
        break
    }

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

    if (!this.app.debugging) {
      const drawing = this.app.pattern.drawing
      const size = drawing.view.size
      let rect = new Paper.Path.Rectangle({
        point: [-size.width*0.5, -size.height*0.5],
        size: [size.width, size.height],
        strokeColor: '#eee',
      });
      rect.sendToBack();
      rect.fillColor = '#ffffff';
      drawing.view.draw()
    } else {
      const drawing = this.app.pattern.drawing
      const size = drawing.view.size
      let rect = new Paper.Path.Rectangle({
        point: [-size.width*0.5, -size.height*0.5],
        size: [size.width*0.25, size.height*0.25],
        strokeColor: 'white',
        selected: true
      });
      rect.sendToBack();
      rect.fillColor = '#ffffff';
      drawing.view.draw()

      rect = new Paper.Path.Rectangle({
        point: [-size.width*0.5, -size.height*0.5],
        size: [size.width*0.5, size.height*0.5],
        strokeColor: 'white',
        selected: true
      });
      rect.sendToBack();
      rect.fillColor = '#ff0000';
      drawing.view.draw()

      rect = new Paper.Path.Rectangle({
        point: [-size.width*0.5, -size.height*0.5],
        size: [size.width*0.75, size.height*0.75],
        strokeColor: 'white',
        selected: true
      });
      rect.sendToBack();
      rect.fillColor = '#00ff00';
      drawing.view.draw()

      rect = new Paper.Path.Rectangle({
        point: [-size.width*0.5, -size.height*0.5],
        size: [size.width, size.height],
        strokeColor: 'white',
        selected: true
      });
      rect.sendToBack();
      rect.fillColor = '#0000ff';
      drawing.view.draw()
    }
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
    let offset = { x: 2*this.resolution, y: 0.5*this.resolution}
    item.position = [item.position.x+offset.x, item.position.y+offset.y]
    this.items.push(item)

    this.seeds = []
    this.seeds.push(this.app.item)
    this.seeds.push(item)

    this.deselect()
    this.app.item = item
    this.select()
    this.update()
  }

  lineInit () {
    this.drawing.activate()
    this.app.mode = 'LINE_INIT'
    this.draftLine = new Paper.Path({
      strokeColor: 'red',
      strokeWidth: 5*this.resolution,
      fullySelected: true
    })
    this.update()
  }

  line () {
    this.drawing.activate()
    this.draftLine.add([this.app.current.pos.x, this.app.current.pos.y])
    this.update()
  }

  lineFinish () {
    this.draftLine.simplify(0.1)
    this.update()
  }

  lineRepeat () {
    this.drawing.activate()
    let segments = this.draftLine.segments
    for (let i=0; i<segments.length; i++) {
      let segment = segments[i]
      let item = this.item.clone()
      item.position = [segment.point.x, segment.point.y]
      this.items.push(item)
    }
    this.draftLine.remove()
    this.update()
  }

  repeat () {
    if (this.app.mode === 'LINE_FINISH') {
      this.lineRepeat()
      return false
    }

    this.drawing.activate()
    let item0 = this.seeds[0]
    let item1 = this.seeds[1]

    let pos0 = new THREE.Vector2(item0.position.x, item0.position.y)
    let pos1 = new THREE.Vector2(item1.position.x, item1.position.y)
    let unit = new THREE.Vector2().subVectors(pos1, pos0).normalize()
    let dist = pos1.distanceTo(pos0)

    this.existItems = _.clone(this.items)
    for (let i=-10; i<10; i++) {
      if (i === 0 || i === 1) continue
      var pos = new THREE.Vector2()
      var vec = unit.clone().multiplyScalar(i*dist)
      pos.addVectors(pos0, vec)

      let item = item0.clone()
      item.position = [pos.x, pos.y]
      item.opacity = 0.3
      item.scalar = i
      item.origin = pos0
      this.items.push(item)
    }

    if (this.repeatCount >= 1) {
      for (let i=0; i<this.existItems.length; i++) {
        let existItem = this.existItems[i]
        if (_.includes(this.seeds, existItem)) continue
        for (let j=-10; j<10; j++) {
          if (j === 0) continue
          let origin = new THREE.Vector2(existItem.position.x, existItem.position.y)
          var pos = new THREE.Vector2()
          var vec = unit.clone().multiplyScalar(j*dist)
          pos.addVectors(origin, vec)

          let item = item0.clone()
          item.position = [pos.x, pos.y]
          item.opacity = 0.3
          item.origin = origin
          item.scalar = j
          this.items.push(item)
        }
      }
    }
    this.update()
    this.app.mode = 'EDIT_INIT'
    $('#edit-finish').addClass('orange')
  }

  edit () {
    this.drawing.activate()
    this.app.item.position = [this.app.current.pos.x, this.app.current.pos.y]
    for (let i=0; i<this.seeds.length; i++) {
      if (this.seeds[i] === this.app.item) {
        this.origin = this.seeds[(i+1)%2]
      }
    }
    let pos0 = new THREE.Vector2(this.origin.position.x, this.origin.position.y)
    let pos1 = new THREE.Vector2(this.app.item.position.x, this.app.item.position.y)
    let unit = new THREE.Vector2().subVectors(pos1, pos0).normalize()
    let dist = pos1.distanceTo(pos0)

    if (this.repeatCount % 2 < 1) {
      for (let i=0; i<this.items.length; i++) {
        let item = this.items[i]
        if (_.includes(this.seeds, item)) continue
        let vec = new THREE.Vector2(item.position.x, item.position.y)
        var pos = new THREE.Vector2()
        var vec = unit.clone().multiplyScalar(item.scalar*dist)
        pos.addVectors(pos0, vec)
        item.position = [pos.x, pos.y]
      }
    } else {
      for (let i=0; i<this.items.length; i++) {
        let item = this.items[i]
        if (_.includes(this.existItems, item)) continue
        if (_.includes(this.seeds, item)) continue
        let vec = new THREE.Vector2(item.position.x, item.position.y)
        var pos = new THREE.Vector2()
        var vec = unit.clone().multiplyScalar(item.scalar*dist)
        pos.addVectors(item.origin, vec)
        item.position = [pos.x, pos.y]
      }
    }
    this.update()
  }

  editFinish () {
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      item.opacity = 1
    }
    this.update()
    this.seeds = []
    this.app.mode = null
    this.app.controls.restart()
    $('#edit-finish').removeClass('orange')
    this.repeatCount++
  }

  update () {
    this.drawing.view.draw()
    this.app.mesh.replace('canvas')
  }

  computeSvgMeshPositions () {
    var svgPath = this.unit.pathData
    var svgMesh = SvgMesh3d(svgPath, {
      scale: 1,
      simplify: Math.pow(10, -10),
      normalize: true
    })
    let positions = svgMesh.positions
    /*
      1. scale: [x, y] -> scale * [x, y]
      2. set center: [0, 0] -> [0.5, 0.5] + alpha
    */
    const scale = 0.2
    var s = scale / 10
    positions = positions.map( (p) => {
      return [ p[0]*s, p[1]*s ]
    })
    this.svgMeshPositions = []
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      let uv = this.app.convertCanvasToUv(item.position)
      let pos = positions.map( (p) => {
        return [ p[0]+uv[0], p[1]+uv[1] ]
      })
      this.svgMeshPositions.push(pos)
    }
  }

}

export default Pattern
