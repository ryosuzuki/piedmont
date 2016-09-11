import THREE from 'three'
import './three'
import Setup from './setup'
import Mesh from './mesh'
import Event from './event'

let canvas = document.getElementById('viewport')
let setup = new Setup({ canvas: canvas })
let mesh = new Mesh(setup)
let event = new Event(setup)

setup.start()
event.start()
mesh.render()

window.setup = setup
window.mesh = mesh
