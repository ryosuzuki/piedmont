
const fs = require('fs')
const path = require('path')
const http = require('http')
const express = require('express')
const webpack = require('webpack')
const config = require('./webpack.config.js')
const favicon = require('serve-favicon')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const app = express()
const compiler = webpack(config)
const port = process.env.PORT || 5000

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


app.listen(port, function(error) {
  if (error) throw error
  console.log('Express server listening on port', port)
})

