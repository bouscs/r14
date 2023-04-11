import { engine } from '../../engine'
import { Interactive } from '../../interactive'
import * as THREE from 'three'
import { Node, NodeProps } from '../Node'
import { MaterialOptions } from '../../material/types'
import { TextureAsset } from '../../asset/TextureAsset'

export interface PlaneProps {
  width: number
  height: number
  widthSegments?: number
  heightSegments?: number
  interactive?: boolean
  material?: MaterialOptions
}

export class Plane extends Node {
  declare $components: Interactive
  declare props: PlaneProps & NodeProps<Plane>

  mesh: THREE.Mesh

  @Node.component(Interactive, function (this: Plane) {
    return { object3D: this.mesh, active: this.props.interactive }
  })
  accessor interactive!: Interactive

  constructor(props: Plane['props']) {
    super(props)

    const geometry = new THREE.PlaneGeometry(
      props.width,
      props.height,
      props.widthSegments,
      props.heightSegments
    )

    const threeMaterialOptions: THREE.MeshBasicMaterialParameters = {
      transparent: props.material?.transparency ?? true,
      opacity: props.material?.opacity ?? 0,
      map: engine.assets.get<TextureAsset>(props.material?.texture || '')
        ?.threeTexture
    }

    const material = new THREE.MeshBasicMaterial(threeMaterialOptions)

    this.mesh = new THREE.Mesh(geometry, material)

    if (props.material) {
      const texture = engine.assets.get<TextureAsset>(
        props.material.texture || ''
      )

      if (texture) {
        this.mesh.scale.set(
          texture.width / texture.pixelsPerUnit,
          texture.height / texture.pixelsPerUnit,
          1
        )
      }
    }

    engine.render.scene.add(this.mesh)
  }

  @Node.on('update')
  update() {
    this.mesh.position.set(this.position.x, this.position.y, this.position.z)
    this.mesh.rotation.copy(new THREE.Euler().setFromQuaternion(this.rotation))
    let width = 1
    let height = 1
    if (this.props.material) {
      const texture = engine.assets.get<TextureAsset>(
        this.props.material.texture || ''
      )

      if (texture) {
        width = texture.width / texture.pixelsPerUnit
        height = texture.height / texture.pixelsPerUnit
      }
    }
    this.mesh.scale.set(
      this.scale.x * width,
      this.scale.y * height,
      this.scale.z
    )
  }
}
