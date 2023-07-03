import { InteractionManager } from 'three.interactive'
import { engine } from '..'
import { Node, NodeProps } from '../node'

import * as THREE from 'three'

export type CameraProps = {
  near?: number
  far?: number
  main?: boolean
} & NodeProps<Node> &
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

  threeCamera!: THREE.Camera

  interactionManager!: InteractionManager

  private _mode: 'orthographic' | 'perspective'

  get mode() {
    return this._mode
  }

  set mode(mode: 'orthographic' | 'perspective') {
    this._mode = mode

    this.setupCamera()
  }

  get canvas() {
    return engine.render.renderer.domElement
  }

  constructor(props: Camera['props']) {
    super(props)

    this._mode = props.mode

    this.setupCamera()

    this.threeCamera.position.copy(this.position)

    this.threeCamera.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )

    this.threeCamera.updateMatrixWorld()
  }

  private setupCamera() {
    if (this.threeCamera) {
      engine.render.emit('removeCamera', this)
      this.threeCamera.clear()
      engine.render.cameras.splice(engine.render.cameras.indexOf(this), 1)

      this.interactionManager.dispose()
    }

    if (this.mode === 'orthographic') {
      const props = this.props as OrthographicCameraProps
      this.threeCamera = new THREE.OrthographicCamera(
        props.width / -2,
        props.width / 2,
        props.height / 2,
        props.height / -2,
        this.props.near,
        this.props.far
      )
    } else {
      const props = this.props as PerspectiveCameraProps
      this.threeCamera = new THREE.PerspectiveCamera(
        props.fov,
        props.aspect,
        this.props.near,
        this.props.far
      )
    }

    engine.render.cameras.push(this)

    if (this.props.main === true) {
      engine.render.mainCamera = this
    }

    this.interactionManager = new InteractionManager(
      engine.render.renderer,
      this.threeCamera,
      engine.render.renderer.domElement
    )

    engine.render.emit('addCamera', this)
  }

  @Node.on('update')
  update() {
    this.threeCamera.position.copy(this.position)

    this.threeCamera.rotation.copy(
      new THREE.Euler().setFromQuaternion(this.rotation)
    )

    this.threeCamera.updateMatrixWorld()
  }

  pointToWorld(pointPosition: THREE.Vector2) {
    const vector = new THREE.Vector3(pointPosition.x, pointPosition.y, 0.5)

    const raycaster = new THREE.Raycaster()

    raycaster.setFromCamera(vector, this.threeCamera)

    return raycaster.ray.origin
  }
}
