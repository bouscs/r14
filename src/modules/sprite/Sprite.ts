import { engine } from '..'
import { Interactive } from '../interactive'
import { Component, Node, NodeProps } from '../node'
import * as THREE from 'three'

export interface SpriteProps {
  texture: string
}

export class Sprite extends Node {
  declare $components: Interactive

  sprite: THREE.Sprite

  material: THREE.SpriteMaterial

  @Node.component(Interactive, function (this: Sprite) {
    return { object3D: this.sprite }
  })
  accessor interactive!: Interactive

  constructor(props: SpriteProps & NodeProps) {
    super(props)

    const map = new THREE.TextureLoader().load(props.texture)

    this.material = new THREE.SpriteMaterial({
      map,
      transparent: true
    })

    this.sprite = new THREE.Sprite(this.material)
    engine.render.scene.add(this.sprite)
  }

  @Node.on('update')
  update() {
    this.sprite.position.set(this.position.x, this.position.y, this.position.z)
    this.sprite.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )
    this.sprite.material.rotation = new THREE.Euler().setFromQuaternion(
      this.rotation
    ).z
  }
}
