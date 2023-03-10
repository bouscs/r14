import { Clock, bound } from 'aureamorum'
import EventEmitter from 'eventemitter3'
import { Node } from '..'

export class RepeaterEngine extends EventEmitter {
  clock: Clock

  root: Node

  constructor() {
    super()

    this.clock = new Clock()

    this.root = new Node()

    this.clock.on('update', this.update)
    this.clock.on('fixedUpdate', this.fixedUpdate)
  }

  @bound
  private update() {
    this.root.emit('update', {
      time: this.clock.time,
      delta: this.clock.delta
    })
  }

  @bound
  private fixedUpdate() {
    this.root.emit('fixedUpdate', {
      time: this.clock.time
    })
  }
}
