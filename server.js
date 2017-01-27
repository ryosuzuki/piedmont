
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const express = require('express')
const webpack = require('webpack')
const config = require('./webpack.config.js')
const favicon = require('serve-favicon')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const bodyParser = require('body-parser')
const execSync = require('child_process').execSync;

const app = express()
const compiler = webpack(config)
const port = process.env.PORT || 8080

app.use(bodyParser.json({ limit: '500mb' }));
app.use(webpackDevMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}))
app.use(webpackHotMiddleware(compiler))
app.use(favicon(__dirname + '/public/assets/favicon.ico'))
app.use(express.static(__dirname + '/dist'))
app.use('/', express.static(__dirname + '/'))
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
})
app.get('/:id', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

app.post('/data', function (req, res) {
  const text = req.body.text
  const type = req.body.type
  fs.writeFileSync(`temp.${type}`, text)
  execSync(`./engine/convert ${type}`)
  execSync(`${os.homedir()}/Documents/c++/cgal/Surface_mesh_parameterization/examples/Surface_mesh_parameterization/build/polyhedron_ex_parameterization ./temp.off ./public/data/out.obj`)
  execSync(`rm temp.${type} temp.off`)
  res.json('ok')
})


app.listen(port, function(error) {
  if (error) throw error
  console.log('Express server listening on port', port)
})

