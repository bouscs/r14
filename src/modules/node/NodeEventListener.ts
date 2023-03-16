import { EventEmitter } from 'aureamorum'
import { Node } from './Node'
import { NodeEvent } from './NodeEvent'

export class NodeEventListener<
  EventName extends string | number | symbol = any,
  EventData = any
> {
  callback: (e: EventData) => void
  emitter: Node & {
    $events: any
  }

  event: EventName

  constructor(
    emitter: Node & {
      $events: any
    },
    event: EventName,
    callback: (e: EventData) => void
  ) {
    this.callback = callback
    this.emitter = emitter
    this.event = event
  }

  off() {
    this.emitter.off(this.event, this.callback)
  }

  until<T>(promise: Promise<T>): Promise<T>
  until<E>(emitter: EventEmitter<E>, event: keyof E): void
  until(emitter: any, event?: any): void | Promise<any> {
    if (emitter instanceof EventEmitter) {
      emitter.once(event, this.off.bind(this))
    } else {
      const promise = emitter as Promise<any>

      return promise.then(this.off.bind(this))
    }
  }
}
