import { Class, EventEmitter, Signal, bound } from 'aureamorum'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'
import { FixedUpdateEvent, NodeEventCallback } from './types'

export interface NodeEventTypes {
  destroy: NodeEvent
  fixedUpdate: FixedUpdateEvent
}

export class Node {
  destroySignal = new Signal({ once: true })

  name: string | symbol = 'Node'

  /**
   * Pseudo-property to define the events that can be emitted by the node.
   */
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
      ) =>
        | void
        | ((listener: NodeEventListener<This['$events'], EventName>) => void),
      context: ClassMethodDecoratorContext<
        any,
        (
          this: This,
          e: This['$events'][EventName]
        ) =>
          | void
          | ((listener: NodeEventListener<This['$events'], EventName>) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: NodeEventListener<This['$events'], EventName>
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

  /**
   * Set the given property to the child node with the given name when the field is first accessed.
   * The result is cached.
   */
  static child(childClass: Class<Node>)
  static child(childName: string | symbol)
  static child(arg0: string | symbol | Class<Node>) {
    return function <This extends Node, Value extends Node>(
      _: any,
      context: ClassAccessorDecoratorContext<This, Value>
    ) {
      context.addInitializer(function (this: This) {
        const _this = this
        Object.defineProperty(this, context.name, {
          get() {
            const result = _this.find(arg0 as any) as Value

            if (result)
              Object.defineProperty(_this, context.name, {
                value: result,
                writable: false
              })

            return result
          },
          configurable: true
        })
      })
    }
  }

  on<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<this['$events'], EventName>
  ): NodeEventListener<this['$events'], EventName> {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = new Set()
    }

    this._listeners[eventName]!.add(listener as any)

    return new NodeEventListener<this['$events']>(this, eventName, listener)
  }

  once<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<this['$events'], EventName>
  ): NodeEventListener<this['$events'], EventName> {
    if (!this._onceListeners[eventName]) {
      this._onceListeners[eventName] = new Set()
    }

    this._onceListeners[eventName]!.add(listener as any)

    return new NodeEventListener<this['$events']>(this, eventName, listener)
  }

  off<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<this['$events'], EventName>
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
  ): void
  emit(eventName: string, e: any): void
  emit(eventName: string, e: any) {
    const callListener = (listener: NodeEventCallback<this['$events']>) => {
      const result = listener(e)

      if (typeof result === 'function') {
        result(new NodeEventListener(this, eventName as any, listener))
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

    this.children.forEach(child => child.emit(eventName as any, e))
  }

  @bound
  free() {
    this.destroySignal.call()
  }

  find(nodeClass: Class<Node>): Node
  find(name: string | symbol): Node
  find(arg0: string | symbol | Class<Node>): Node {
    if (typeof arg0 === 'string' || typeof arg0 === 'symbol') {
      return this.children.find(child => child.name === arg0)!
    }

    return this.children.find(child => child instanceof arg0)!
  }

  add(node: Node) {
    node.parent = this
  }
}
