import { engine } from '..'
import { Interactive } from '../interactive'
import { MaterialOptions } from '../material/types'
import { Node, NodeProps } from '../node'
import * as THREE from 'three'

export interface SpriteProps {
  material?: MaterialOptions
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

    const image = engine.assets.get<'image'>(
      props.material?.texture?.imageAsset ?? ''
    )

    const texture = image ? new THREE.Texture(image) : undefined
    if (texture) texture.needsUpdate = true

    const threeMaterialOptions: THREE.SpriteMaterialParameters = {
      transparent: props.material?.transparency ?? true,
      opacity: props.material?.opacity ?? 1,
      map: texture
    }

    this.material = new THREE.SpriteMaterial(threeMaterialOptions)

    this.sprite = new THREE.Sprite(this.material)

    if (image) {
      const texture = props.material!.texture!
      const pixelsPerUnit = texture.pixelsPerUnit ?? 100

      this.sprite.scale.set(
        image.width / pixelsPerUnit,
        image.height / pixelsPerUnit,
        1
      )
    }

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
