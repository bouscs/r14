import { engine } from '..'
import { Interactive } from '../interactive'
import { Node, NodeProps } from '../node'
import * as THREE from 'three'

export interface SpriteProps extends NodeProps {
  texture: string
}

export class Sprite extends Node {
  sprite: THREE.Mesh

  material: THREE.Material

  // @Node.component(Interactive, {})
  accessor interactive!: Interactive

  constructor(props: SpriteProps) {
    super(props)

    const map = new THREE.TextureLoader().load(props.texture)
    this.material = new THREE.MeshBasicMaterial({
      map,
      transparent: true
    })

    const geometry = new THREE.PlaneGeometry(1, 1)

    this.sprite = new THREE.Mesh(geometry, this.material)
    engine.render.scene.add(this.sprite)

    this.interactive = new Interactive(this, {})
  }

  @Node.on('update')
  update() {
    this.sprite.position.set(this.position.x, this.position.y, this.position.z)
    this.sprite.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )
  }
}
