import loadsvg from 'load-svg'
import Paper from 'paper'

class Paint {
  constructor (app) {
    this.app = app
    this.file = '/public/assets/donald.svg'

    let canvas = document.getElementById('original')
    canvas.width = 256
    canvas.height = 256

    this.original = new Paper.PaperScope()
    this.original.setup($('#original')[0])
    this.original.view.center = [0, 0]
    this.original.view.viewSize = [256, 256] // new paper.Size(256, 256)

    this.initialize()
  }

  initialize () {
    loadsvg(this.file, function (err, svg) {
      this.original.activate()
      let d = $('path', svg).attr('d');
      this.path = new Paper.Path(d)
      // var path = new paper.Path.Rectangle(new paper.Point(-100, -100), new paper.Point(100, 100))
      // var path = new paper.Path.Circle(new paper.Point(0, 0), 256)
      this.path.strokeColor = 'black'
      this.path.fillColor = 'black'
      this.path.closed = true
      this.path.position = [0, 0]
      this.path.scale(1/5)
      this.original.view.draw()

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
      this.path.scale(axis['horizontal'].x, axis['horizontal'].y)
      this.original.view.draw()
      this.update()
    }.bind(this))
  }

  update () {
    this.app.pattern.initialize(this.path)
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