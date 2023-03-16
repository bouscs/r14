import { InteractionManager } from 'three.interactive'
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
  declare props: CameraProps

  camera!: THREE.Camera

  interactionManager!: InteractionManager

  private _mode: 'orthographic' | 'perspective'

  get mode() {
    return this._mode
  }

  set mode(mode: 'orthographic' | 'perspective') {
    this._mode = mode

    this.setCamera()
  }

  constructor(props: CameraProps) {
    super(props)

    this._mode = props.mode

    this.setCamera()

    this.camera.position.copy(this.position)

    this.camera.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )

    this.camera.updateMatrixWorld()
  }

  setCamera() {
    if (this.camera) {
      engine.render.emit('removeCamera', this)
      this.camera.clear()
      engine.render.cameras.splice(engine.render.cameras.indexOf(this), 1)

      this.interactionManager.dispose()
    }

    if (this.mode === 'orthographic') {
      const props = this.props as OrthographicCameraProps
      this.camera = new THREE.OrthographicCamera(
        props.width / -2,
        props.width / 2,
        props.height / 2,
        props.height / -2,
        this.props.near,
        this.props.far
      )
    } else {
      const props = this.props as PerspectiveCameraProps
      this.camera = new THREE.PerspectiveCamera(
        props.fov,
        props.aspect,
        this.props.near,
        this.props.far
      )
    }
    engine.render.cameras.push(this)

    this.interactionManager = new InteractionManager(
      engine.render.renderer,
      this.camera,
      engine.render.renderer.domElement
    )

    engine.render.emit('addCamera', this)
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
