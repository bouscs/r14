import { engine } from '..'
import { Interactive } from '../interactive'
import { Component, Node, NodeProps } from '../node'
import * as THREE from 'three'

export interface SpriteProps {
  texture: string
}

export class Sprite extends Node {
  declare $components: Interactive

  sprite: THREE.Mesh

  material: THREE.Material

  @Node.component(Interactive, function (this: Sprite) {
    return { object3D: this.sprite }
  })
  accessor interactive!: Interactive

  constructor(props: SpriteProps & NodeProps) {
    super(props)

    const map = new THREE.TextureLoader().load(props.texture)
    this.material = new THREE.MeshBasicMaterial({
      map,
      transparent: true
    })

    const geometry = new THREE.PlaneGeometry(1, 1)

    this.sprite = new THREE.Mesh(geometry, this.material)
    engine.render.scene.add(this.sprite)
  }

  @Node.on('update')
  update() {
    this.sprite.position.set(this.position.x, this.position.y, this.position.z)
    this.sprite.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )
  }
}
