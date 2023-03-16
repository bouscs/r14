import { InteractionManager } from 'three.interactive'
import { engine } from '..'
import { Component, Node, NodeEvent } from '../node'
import { Sprite } from '../sprite'
import { bound } from 'aureamorum'
import { Camera } from '../camera'
import * as THREE from 'three'

export interface InteractiveProps {}

export type PointerNodeEvent = NodeEvent & {
  originalEvent: PointerEvent
}

export interface InteractiveEvents {
  pointerDown: PointerNodeEvent
  pointerUp: PointerNodeEvent
  pointerOver: PointerNodeEvent
  pointerOut: PointerNodeEvent
  pointerMove: PointerNodeEvent
}

export class Interactive extends Component<Sprite> {
  declare props: InteractiveProps

  isPointerDown = false
  isPointerOver = false

  raycaster: THREE.Raycaster

  pointerPosition = new THREE.Vector2()

  constructor(node: Sprite, props: InteractiveProps = {}) {
    super(node, props)

    this.raycaster = new THREE.Raycaster()

    engine.render.renderer.domElement.addEventListener(
      'pointerdown',
      this.onPointerDown
    )

    engine.render.renderer.domElement.addEventListener(
      'pointermove',
      this.onPointerMove
    )

    this.node.destroySignal.once(() => {
      engine.render.renderer.domElement.removeEventListener(
        'pointerdown',
        this.onPointerDown
      )
      engine.render.renderer.domElement.removeEventListener(
        'pointermove',
        this.onPointerMove
      )
    })
  }

  @bound
  onPointerDown(event: PointerEvent) {
    const canvasRect = engine.render.renderer.domElement.getBoundingClientRect()
    this.pointerPosition.x =
      ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1
    this.pointerPosition.y =
      -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1

    const camera = engine.render.cameras[0]

    this.raycaster.setFromCamera(this.pointerPosition, camera.camera)

    const intersects = this.raycaster.intersectObject(this.node.sprite)

    if (intersects.length > 0) {
      this.node.emitUp(
        'pointerDown',
        Object.assign(new NodeEvent(), {
          originalEvent: event
        })
      )
    }

    this.isPointerDown = true
  }

  @bound
  onPointerMove(event: PointerEvent) {
    const canvasRect = engine.render.renderer.domElement.getBoundingClientRect()
    this.pointerPosition.x =
      ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1
    this.pointerPosition.y =
      -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1

    const camera = engine.render.cameras[0]

    this.raycaster.setFromCamera(this.pointerPosition, camera.camera)

    const intersects = this.raycaster.intersectObject(this.node.sprite)

    if (intersects.length > 0) {
      this.node.emitUp(
        'pointerMove',
        Object.assign(new NodeEvent(), {
          originalEvent: event
        })
      )
    }
  }

  // // @bound
  // addCamera(camera: Camera) {
  //   camera.interactionManager.add(this.node.sprite)
  // }

  // // @bound
  // removeCamera(camera: Camera) {
  //   camera.interactionManager.remove(this.node.sprite)
  // }

  // @Component.on('destroy')
  // onDestroy() {
  //   engine.render.cameras.forEach(camera => {
  //     camera.interactionManager.remove(this.node.sprite)
  //   })
  // }
}
