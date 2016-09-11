import THREE from 'three'
import './three'
import App from './app'

let canvas = document.getElementById('viewport')
let app = new App({ canvas: canvas })

app.start()
window.app = app
