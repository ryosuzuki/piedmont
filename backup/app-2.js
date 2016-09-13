const route = require('koa-route')
const views = require('co-views')
const favicon = require('koa-favicon')
const serve = require('koa-static')
const parser = require('koa-bodyparser')
const koa = require('koa.io')
const co = require('co')

const webpackDevServer = require('koa-webpack-dev')
const webpackDevMiddleware = require('koa-webpack-dev-middleware')
const webpackHotMiddleware = require('koa-webpack-hot-middleware')

const server = http.createServer(app.callback())
const port = process.env.PORT || 3000

app.use(webpackDevServer({
  config: './webpack.config.js'
}));
app.use(serve('.'))
app.use(favicon('/public/assets/favicon.ico'))
app.use(parser({
  strict: false,
  jsonLimit: '5000mb',
  formLimit: '5000mb',
  extendTypes: {
    json: ['application/x-javascript']
  }
}))
app.use( function *(next) {
  this.render = views('views', {
    map: { html: 'swig' },
  })
  yield next
})
app.use(route.get('/', index))
app.use(route.get('/favicon.ico', null))
app.use(route.get('/tasks/:id', show))
app.use(route.get('/prototype', prototype))

app.io.route('connection', function *(next, json) {
  console.log('connected')
  var uniq = json.uniq
  var faces = json.faces
  var map = json.map
  var str = '';
  for (var i=0; i<uniq.length; i++) {
    str += 'v ' +
    uniq[i].vertex.x + ' ' +
    uniq[i].vertex.y + ' ' +
    uniq[i].vertex.z + '\n';
  }
  for (var i=0; i<faces.length; i++) {
    str += 'f ' +
    (map[faces[i].a] + 1) + ' ' +
    (map[faces[i].b] + 1) + ' ' +
    (map[faces[i].c] + 1) + '\n'
  }
  console.log('create obj file')
  fs.writeFileSync('data/demo.obj', str, 'utf8')
})

app.io.route('update-dgpc', function *(next, json) {
  console.log('Update DGPC')
  var filename = __dirname + '/data/demo.obj'
  json.filename = filename
  var result = dgpc.getMapping(json)
  result.start = json.start
  this.emit('res-update-dgpc', result)
})

app.io.route('update-harmonic', function *(next, json) {
  console.log('Update Harmonic Field')
  var filename = __dirname + '/data/demo.obj'
  json.filename = filename
  console.log(json)
  var result = harmonic.getHarmonicField(json)
  this.emit('res-update-harmonic', result)
})


function *index() {
  this.body = yield this.render('index')
}

function *show(id) {
  this.body = yield this.render('index', { id: id })
}

function *prototype() {
  this.body = yield this.render('playground')
}


app.listen(port)

module.exports = app