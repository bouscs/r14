import { engine } from '..'
import { Component, ComponentNode, Node, NodeEvent } from '../node'
import { bound } from 'bouscs-util'
import * as THREE from 'three'

export interface InteractiveProps {
  object3D: THREE.Object3D
  active?: boolean
}

export type PointerNodeEvent = NodeEvent & {
  originalEvent: PointerEvent
  pointerX: number
  pointerY: number
}

export interface InteractiveEvents extends Record<string, NodeEvent> {
  pointerDown: PointerNodeEvent
  pointerUp: PointerNodeEvent
  pointerOver: PointerNodeEvent
  pointerOut: PointerNodeEvent
  pointerMove: PointerNodeEvent

  dragStart: PointerNodeEvent
  drag: PointerNodeEvent
  dragEnd: PointerNodeEvent
}

export class Interactive extends Component {
  declare props: InteractiveProps
  declare $events: InteractiveEvents
  declare node: ComponentNode<Interactive>

  isPointerDown = false
  isPointerOver = false
  isDragging = false

  raycaster: THREE.Raycaster

  pointerPosition = new THREE.Vector2()

  active = false

  constructor(node: Node, props: InteractiveProps) {
    super(node, props)

    this.raycaster = new THREE.Raycaster()

    if (props.active) {
      this.activate()
    }
  }

  @bound
  activate() {
    this.active = true

    const on = engine.render.renderer.domElement.addEventListener

    on('pointerdown', this.onPointerDown)
    on('pointermove', this.onPointerMove)
  }

  @bound
  onPointerDown(event: PointerEvent) {
    if (this.isPointerOver) {
      this.node.emitUp(
        'pointerDown',
        Object.assign(new NodeEvent(), {
          originalEvent: event,
          pointerX: this.pointerPosition.x,
          pointerY: this.pointerPosition.y
        })
      )

      this.isPointerDown = true

      this.node.emitUp(
        'dragStart',
        Object.assign(new NodeEvent(), {
          originalEvent: event,
          pointerX: this.pointerPosition.x,
          pointerY: this.pointerPosition.y
        })
      )

      this.isDragging = true

      window.addEventListener('pointerup', this.onDragEnd)
    }
  }

  @bound
  onPointerMove(event: PointerEvent) {
    // Handle drag
    if (this.isDragging) {
      this.node.emitUp(
        'drag',
        Object.assign(new NodeEvent(), {
          originalEvent: event,
          pointerX: this.pointerPosition.x,
          pointerY: this.pointerPosition.y
        })
      )
    }

    // Handle pointerMove
    this.isPointerOver = false

    const canvasRect = engine.render.renderer.domElement.getBoundingClientRect()
    this.pointerPosition.x =
      ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1
    this.pointerPosition.y =
      -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1

    const camera = engine.render.cameras[0]

    this.raycaster.setFromCamera(this.pointerPosition, camera.threeCamera)

    const intersects = this.raycaster.intersectObject(this.props.object3D)

    const pointerX = this.pointerPosition.x
    const pointerY = this.pointerPosition.y

    if (intersects.length > 0) {
      this.node.emitUp(
        'pointerMove',
        Object.assign(new NodeEvent(), {
          originalEvent: event,
          pointerX,
          pointerY
        })
      )

      this.isPointerOver = true
    }
  }

  @bound
  onPointerUp(event: PointerEvent) {
    if (this.isPointerOver) {
      this.node.emitUp(
        'pointerUp',
        Object.assign(new NodeEvent(), {
          originalEvent: event,
          pointerX: this.pointerPosition.x,
          pointerY: this.pointerPosition.y
        })
      )

      this.isPointerDown = false
    }
  }

  @bound
  onDragEnd(e: PointerEvent) {
    this.node.emitUp(
      'dragEnd',
      Object.assign(new NodeEvent(), {
        originalEvent: e,
        pointerX: this.pointerPosition.x,
        pointerY: this.pointerPosition.y
      })
    )

    this.isDragging = false
  }

  @Component.on('destroy')
  onDestroy() {
    if (this.active) {
      const off = engine.render.renderer.domElement.removeEventListener

      off('pointerdown', this.onPointerDown)
      off('pointermove', this.onPointerMove)
      off('pointerup', this.onPointerUp)
      window.removeEventListener('pointerup', this.onDragEnd)
    }
  }
}
