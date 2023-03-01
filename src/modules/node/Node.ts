import {
  EventArgs,
  EventEmitter,
  EventListOf,
  EventListener,
  Signal,
  bound
} from 'aureamorum'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'
import { FixedUpdateEvent, NodeEventCallback } from './types'

export interface NodeEventTypes {
  destroy: NodeEvent
  fixedUpdate: FixedUpdateEvent
}

export class Node {
  destroySignal = new Signal({ once: true })

  declare $events: NodeEventTypes

  private _children: Node[] = []

  private _parent: Node | null = null

  private _listeners: {
    [K in keyof this['$events']]?: Set<NodeEventCallback<any, any>>
  } = {}

  private _onceListeners: {
    [K in keyof this['$events']]?: Set<NodeEventCallback<any, any>>
  } = {}

  get children() {
    return [...this._children]
  }

  get parent() {
    return this._parent
  }

  set parent(parent: Node | null) {
    if (this._parent === parent) {
      return
    }

    if (this._parent) {
      this._parent._children.splice(this._parent._children.indexOf(this), 1)
    }

    this._parent = parent

    if (this._parent) {
      this._parent._children.push(this)
    }
  }

  get root(): Node {
    if (this._parent) {
      return this._parent.root
    }

    return this
  }

  /**
   * Add method as a listener to the given event when the node is initialized. The listener will be removed when the node is destroyed.
   */
  static on<This extends Node, EventName extends keyof This['$events']>(
    event: EventName,
    options: {
      once?: boolean
      until?: (this: This) => Signal | [EventEmitter, string]
    } = {}
  ) {
    return (
      originalMethod: (
        this: This,
        e: This['$events'][EventName]
      ) => void | ((listener: NodeEventListener<This, EventName>) => void),
      context: ClassMethodDecoratorContext<
        any,
        (
          this: This,
          e: This['$events'][EventName]
        ) => void | ((listener: NodeEventListener<This, EventName>) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: NodeEventListener<This, EventName>
        if (options.once) {
          listener = this.once(event, originalMethod.bind(this))
        } else {
          listener = this.on(event, originalMethod.bind(this))
        }

        listener.until(this.destroySignal)

        if (options.until) {
          const until = options.until.call(this)
          if (until instanceof Signal) {
            listener.until(until)
          } else {
            listener.until(until[0], until[1])
          }
        }
      })
    }
  }

  on<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<this, EventName>
  ): NodeEventListener<this, EventName> {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = new Set()
    }

    this._listeners[eventName]!.add(listener as any)

    return new NodeEventListener(this, eventName, listener)
  }

  once<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<this, EventName>
  ): NodeEventListener<this, EventName> {
    if (!this._onceListeners[eventName]) {
      this._onceListeners[eventName] = new Set()
    }

    this._onceListeners[eventName]!.add(listener as any)

    return new NodeEventListener(this, eventName, listener)
  }

  off<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<this, EventName>
  ): void {
    if (this._listeners[eventName]) {
      this._listeners[eventName]!.delete(listener as any)

      if (this._listeners[eventName]!.size === 0) {
        delete this._listeners[eventName]
      }
    }

    if (this._onceListeners[eventName]) {
      this._onceListeners[eventName]!.delete(listener as any)

      if (this._onceListeners[eventName]!.size === 0) {
        delete this._onceListeners[eventName]
      }
    }
  }

  emit<EventName extends keyof this['$events']>(
    eventName: EventName,
    e: this['$events'][EventName]
  ): void {
    const callListener = (listener: NodeEventCallback<this, any>) => {
      const result = listener(e)

      if (typeof result === 'function') {
        result(new NodeEventListener(this, eventName, listener))
      }
    }

    if (this._listeners[eventName]) {
      for (const listener of this._listeners[eventName]!) {
        callListener(listener)
      }
    }

    if (this._onceListeners[eventName]) {
      for (const listener of this._onceListeners[eventName]!) {
        callListener(listener)
      }

      this._onceListeners[eventName]!.clear()

      delete this._onceListeners[eventName]
    }
  }

  @bound
  free() {
    this.destroySignal.call()
  }
}
