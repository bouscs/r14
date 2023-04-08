import { engine } from '../../engine'
import { Interactive } from '../../interactive'
import * as THREE from 'three'
import { Node, NodeProps } from '../Node'
import { GetEvents } from '../types'
import { MaterialOptions } from '../../material/types'

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

    const material = new THREE.MeshBasicMaterial(props.material)

    this.mesh = new THREE.Mesh(geometry, material)
    engine.render.scene.add(this.mesh)
  }

  @Node.on('update')
  update() {
    this.mesh.position.set(this.position.x, this.position.y, this.position.z)
    this.mesh.rotation.copy(new THREE.Euler().setFromQuaternion(this.rotation))
  }
}
