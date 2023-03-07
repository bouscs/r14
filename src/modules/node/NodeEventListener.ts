import { EventEmitter, Signal } from 'aureamorum'
import { Node, NodeEventTypes } from './Node'
import { NodeEvents } from './types'

export class NodeEventListener<
  Events extends NodeEventTypes = NodeEventTypes,
  EventName extends keyof Events = any
> {
  callback: (e: Events[EventName]) => void
  emitter: Node<Events>

  event: EventName

  constructor(
    emitter: Node<Events>,
    event: EventName,
    callback: (e: Events[EventName]) => void
  ) {
    this.callback = callback
    this.emitter = emitter
    this.event = event
  }

  off() {
    this.emitter.off(this.event, this.callback as any)
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
