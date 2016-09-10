import THREE from 'three'
import './three'
import Setup from './setup'

let canvas = document.getElementById('viewport')
let setup = new Setup({ canvas: canvas })

setup.start()

