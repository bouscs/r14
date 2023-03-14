import { engine } from '../../main'
import { Node, NodeProps } from '../node'

import * as THREE from 'three'

export type CameraProps = {
  near?: number
  far?: number
} & NodeProps &
  (OrthographicCameraProps | PerspectiveCameraProps)

export interface OrthographicCameraProps {
  mode: 'orthographic'
  width: number
  height: number
}

export interface PerspectiveCameraProps {
  mode: 'perspective'
  fov?: number
  aspect?: number
}

export class Camera extends Node {
  camera: THREE.Camera

  constructor(props: CameraProps) {
    super(props)

    if (props.mode === 'orthographic') {
      this.camera = new THREE.OrthographicCamera(
        props.width / -2,
        props.width / 2,
        props.height / 2,
        props.height / -2,
        props.near,
        props.far
      )
    } else {
      this.camera = new THREE.PerspectiveCamera(
        props.fov,
        props.aspect,
        props.near,
        props.far
      )
    }

    this.camera.position.copy(this.position)

    this.camera.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )

    this.camera.updateMatrixWorld()

    engine.render.cameras.push(this.camera)
  }

  @Node.on('update')
  update() {
    this.camera.position.copy(this.position)

    this.camera.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )

    this.camera.updateMatrixWorld()
  }
}
