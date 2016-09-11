import loadsvg from 'load-svg'
import Paper from 'paper'

window.Paper = Paper
class Paint {
  constructor (app) {
    this.app = app
    this.file = '/public/assets/star.svg'

    let canvas = document.getElementById('original')
    canvas.width = 256
    canvas.height = 256
    let drawing = document.getElementById('drawing')
    drawing.width = 512 // 1280 // 256
    drawing.height = 512 //1280 // 256

    this.original = new Paper.PaperScope()
    this.original.setup($('#original')[0])
    this.original.view.center = [0, 0]
    this.original.view.viewSize = [256, 256] // new paper.Size(256, 256)

    this.drawing = new Paper.PaperScope()
    this.drawing.setup($('#drawing')[0])
    this.drawing.view.center = [0, 0]
    this.drawing.view.viewSize = [512, 512] // [1280, 1280] // new paper.Size(256, 256)

    this.initialize()
  }

  initialize () {
    loadsvg(this.file, function (err, svg) {
      this.paper = this.original
      this.paper.activate()
      let d = $('path', svg).attr('d');
      let path = new Paper.Path(d)
      // var path = new paper.Path.Rectangle(new paper.Point(-100, -100), new paper.Point(100, 100))
      // var path = new paper.Path.Circle(new paper.Point(0, 0), 256)
      path.strokeColor = 'black'
      path.fillColor = 'black'
      path.closed = true
      path.position = [0, 0]
      path.scale(1/5)
      this.paper.view.draw()
      // updateOriginal(path)
      var axis = {
        'horizontal': {
          'x': -1,
          'y': 1
        },
        'vertical': {
          'x': 1,
          'y': -1
        }
      }
      path.scale(axis['horizontal'].x, axis['horizontal'].y)
      this.paper.view.draw()
    }.bind(this))
  }

  listen () {
    $('#original').draggable({
      accept: '#viewport',
      // revert: 'invalid',
      opacity: 0.7,
      cursor: 'move',
      helper: function (e, ui) {
        // var canvas = $(this).clone();
        let source = document.getElementById('original')
        let copy = document.createElement('canvas')
        copy.width = 256 //source.width
        copy.height = 256 // source.height
        let context = copy.getContext('2d')
        context.drawImage(source, 0, 0, 256, 256)
        // $(copy).css('background', 'red')
        return copy
      },
      start: function (e, ui) {
        window.app.mode = 'DRAG'
        console.log('dragging start')
      },
      stop: function (e, ui) {
        window.app.mode = 'DROP'
        console.log('dragging end')
      }
    })
  }
}

export default Paint