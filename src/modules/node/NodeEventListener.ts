import { EventEmitter } from 'aureamorum'
import { Node } from './Node'

export class NodeEventListener<
  Events extends Node['$events'] = Node['$events'],
  EventName extends keyof Events = any
> {
  callback: (e: Events[EventName]) => void
  emitter: Node

  event: EventName

  constructor(
    emitter: Node,
    event: EventName,
    callback: (e: Events[EventName]) => void
  ) {
    this.callback = callback
    this.emitter = emitter
    this.event = event
  }

  off() {
    this.emitter.off(this.event as any, this.callback as any)
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
