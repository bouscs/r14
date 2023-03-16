import { InteractionManager } from 'three.interactive'
import { engine } from '../../main'
import { Component, Node, NodeEvent } from '../node'
import { Sprite } from '../sprite'
import { bound } from 'aureamorum'
import { Camera } from '../camera'

export interface InteractiveProps {}

export class Interactive extends Component<Sprite> {
  declare props: InteractiveProps

  constructor(node: Sprite, props: InteractiveProps = {}) {
    super(node, props)
    this.addCamera = this.addCamera.bind(this)
    this.removeCamera = this.removeCamera.bind(this)
    engine.render.cameras.forEach(this.addCamera)

    engine.render.on('addCamera', this.addCamera)

    engine.render.on('removeCamera', this.removeCamera)

    this.node.once(
      'destroy',
      (() => {
        engine.render.cameras.forEach(this.removeCamera)
      }).bind(this)
    )

    console.log(this.node)

    this.node.sprite.addEventListener('click', () => {
      this.node.emitUp('click', new NodeEvent())
    })

    this.node.sprite.addEventListener('mouseover', () => {
      this.node.emitUp('mouseOver', new NodeEvent())
    })

    this.node.sprite.addEventListener('mouseout', () => {
      this.node.emitUp('mouseOut', new NodeEvent())
    })

    this.node.sprite.addEventListener('mouseleave', () => {
      this.node.emitUp('mouseLeave', new NodeEvent())
    })

    this.node.sprite.addEventListener('mousedown', () => {
      this.node.emitUp('mouseDown', new NodeEvent())
    })

    this.node.sprite.addEventListener('mouseup', () => {
      this.node.emitUp('mouseUp', new NodeEvent())
    })

    this.node.sprite.addEventListener('mousemove', () => {
      this.node.emitUp('mouseMove', new NodeEvent())
    })

    this.node.sprite.addEventListener('touchstart', () => {
      this.node.emitUp('touchStart', new NodeEvent())
    })

    this.node.sprite.addEventListener('touchend', () => {
      this.node.emitUp('touchEnd', new NodeEvent())
    })

    this.node.sprite.addEventListener('touchmove', () => {
      this.node.emitUp('touchMove', new NodeEvent())
    })

    this.node.sprite.addEventListener('pointerdown', () => {
      this.node.emitUp('pointerDown', new NodeEvent())
    })

    this.node.sprite.addEventListener('pointerup', () => {
      this.node.emitUp('pointerUp', new NodeEvent())
    })

    this.node.sprite.addEventListener('pointermove', e => {
      this.node.emitUp(
        'pointerMove',
        Object.assign(new NodeEvent(), {
          movementX: e.originalEvent.movementX,
          movementY: e.originalEvent.movementY
        })
      )
    })
  }

  // @bound
  addCamera(camera: Camera) {
    camera.interactionManager.add(this.node.sprite)
  }

  // @bound
  removeCamera(camera: Camera) {
    camera.interactionManager.remove(this.node.sprite)
  }

  // @Component.on('destroy')
  // onDestroy() {
  //   engine.render.cameras.forEach(camera => {
  //     camera.interactionManager.remove(this.node.sprite)
  //   })
  // }
}
