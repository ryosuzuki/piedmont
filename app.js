
const fs = require('fs')
const path = require('path')
const http = require('http')
const express = require('express')
const config = require('./webpack.config.js')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const app = express()
const compiler = webpack(config)
const port = process.env.PORT || 3000

app.use(webpackDevMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}))
app.use(webpackHotMiddleware(compiler))

app.use(express.static(__dirname + '/dist'))
app.use('/src', express.static(__dirname + '/src'))
app.use('/public', express.static(__dirname + '/public'))
app.use('/bower_components', express.static(__dirname + '/bower_components'))
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index')
})

app.listen(port, function(error) {
  if (error) throw error
  console.log('Express server listening on port', port)
})

