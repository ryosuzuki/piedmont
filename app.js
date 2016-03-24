
var fs = require('fs')
var path = require('path')
var http = require('http')
var route = require('koa-route')
var views = require('co-views')
var favicon = require('koa-favicon')
var serve = require('koa-static')
var parser = require('koa-bodyparser')
var koa = require('koa.io')
var co = require('co')
var Q = require('q')
var threeOBJ = require('three-obj')()

var app = koa()
var server = http.createServer(app.callback())
var port = process.env.PORT || 3000
var compute = require('./engine/compute/index.js')
var dgpc = require('./engine/dgpc/index.js')


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
app.use(route.get('/:id', show))
app.use(route.post('/get-obj', getObj))
app.use(route.post('/get-dgpc', getDgpc))
app.use(route.post('/get-laplacian', getLaplacian))
app.use(route.post('/get-mapping', getMapping))
app.use(route.post('/get-boundary', getBoundary))
app.use(route.post('/save', save))
app.use(route.post('/stl', generateSTL))

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
  fs.writeFileSync('data/hoge.obj', str, 'utf8')
})

app.io.route('update', function *(next, start) {
  console.log('update')
  var filename = __dirname + '/data/hoge.obj'
  console.log(start)
  var result = dgpc.getMapping(filename, start)
  result.start = start
  this.emit('res-update', result)
})

function *index() {
  this.body = yield this.render('index')
}
function *show(id) {
  this.body = yield this.render(id)
}

function *getObj() {
  var json = fs.readFileSync('demo.json')
  // var json = fs.readFileSync('cow.json')
  this.response.body = json
}

function *getDgpc() {
  var json = this.request.body.json
  json = JSON.parse(json)
  var result = dgpc.getMapping(json)
  this.response.body = result
}

function *getLaplacian() {
  var json = this.request.body.json
  json = JSON.parse(json)
  var result = compute.getField(json)
  this.response.body = result
}

function *getBoundary() {
  var json = this.request.body.json
  json = JSON.parse(json)
  var result = compute.getBoundary(json)
  this.response.body = result
}

function *getMapping() {
  var json = this.request.body.json
  json = JSON.parse(json)
  var result = compute.getMapping(json)
  this.response.body = result
}

function *save() {
  var json = this.request.body.json
  // json = JSON.parse(json)
  console.log(json)
  fs.writeFileSync('hoge.json', json, 'utf8')
}

var Geometry = require('./engine/voxelize/src/geometry')
var stl = require('ndarray-stl')

function *generateSTL () {
  var body = this.request.body
  var json = this.request.body.json
  // fs.writeFileSync('sample.json', json, 'utf8')
  json = JSON.parse(json)
  console.log('Start voxelization...')
  /*
  json = {
    cells:
    positions:
    mappings:
    selected_cells:
    resolution:
  }
  */
  var geometry = new Geometry(json)
  var object = geometry.voxelize(0.02)
  var data = stl(object.voxels)
  // fs.writeFileSync('hoge.stl', str, 'utf8')
  console.log('done')
  fs.writeFileSync('/Users/ryosuzuki/Downloads/hoge.stl', data, 'utf8')
  this.status = 200
  this.response.body = JSON.stringify(data)
}





app.listen(port)

module.exports = app
