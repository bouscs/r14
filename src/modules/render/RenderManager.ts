import * as THREE from 'three'
import { engine } from '..'
import { EventEmitter, bound } from 'aureamorum'
import { InteractionManager } from 'three.interactive'
import { Camera } from '../camera'

export interface RenderManagerEvents {
  addCamera: (camera: Camera) => void
  removeCamera: (camera: Camera) => void
}

export class RenderManager extends EventEmitter<RenderManagerEvents> {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer

  cameras: Camera[] = []

  mainCamera!: Camera

  constructor() {
    super()
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(800, 600)
    document.body.appendChild(this.renderer.domElement)

    engine.clock.on('update', this.update)
  }

  @bound
  update() {
    if (!this.mainCamera) return
    this.renderer.render(this.scene, this.mainCamera.threeCamera)
  }
}
