import * as THREE from 'three'
import { engine } from '../../main'
import { bound } from 'aureamorum'

export class RenderManager {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer

  cameras: THREE.Camera[] = []

  constructor() {
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(800, 600)
    document.body.appendChild(this.renderer.domElement)

    engine.clock.on('update', this.update)
  }

  @bound
  update() {
    if (this.cameras.length === 0) return
    this.renderer.render(this.scene, this.cameras[0])
  }
}
