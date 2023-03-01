import { Clock } from 'aureamorum'
import EventEmitter from 'eventemitter3'

export class RepeaterEngine extends EventEmitter {
  clock: Clock

  constructor() {
    super()

    this.clock = new Clock()
  }
}
