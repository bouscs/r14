import { EventEmitter, Signal } from 'aureamorum'
import { Node } from './Node'

export class NodeEventListener<
  N extends {
    $events: any
    off: (event: any, callback: (...args: any[]) => void) => void
  } = Node,
  EventName extends keyof N['$events'] = any
> {
  callback: (e: N['$events'][EventName]) => void
  emitter: N

  event: EventName

  constructor(
    emitter: N,
    event: EventName,
    callback: (e: N['$events'][EventName]) => void
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
