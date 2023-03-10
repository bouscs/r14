import { Class, EventEmitter, Signal, bound, getClass, rad } from 'aureamorum'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'
import {
  FixedUpdateEvent,
  NodeEventCallback,
  NodeTemplate,
  UpdateEvent
} from './types'
import * as THREE from 'three'
import { EulerSimple, Vector3Simple } from '..'

export interface NodeEventTypes {
  destroy: NodeEvent
  fixedUpdate: FixedUpdateEvent
  update: UpdateEvent
}

export interface NodeProps {
  name?: string | symbol
  position?: Vector3Simple
  rotation?: EulerSimple
  scale?: Vector3Simple

  children?: Node[]
}

export const nodeTemplateSymbol = Symbol('nodeTemplate')

export class Node {
  destroySignal = new Signal({ once: true })

  name: string | symbol = 'Node'

  timeScale = 1

  private _delta = 0

  get delta() {
    return this._delta * this.timeScale * (this.parent?.timeScale ?? 1)
  }

  localPosition = new THREE.Vector3()

  localRotation = new THREE.Quaternion()

  localScale = new THREE.Vector3(1, 1, 1)

  get localMatrix4() {
    const matrix = new THREE.Matrix4()

    matrix.compose(this.localPosition, this.localRotation, this.localScale)

    return matrix
  }

  get localMatrix3() {
    const matrix = new THREE.Matrix3()

    matrix.setFromMatrix4(this.localMatrix4)

    return matrix
  }

  get worldMatrix4() {
    const matrix = new THREE.Matrix4()

    if (this.parent) {
      matrix.multiplyMatrices(
        this.parent.worldMatrix4,
        this.parent.localMatrix4
      )
    }

    return matrix
  }

  get worldQuaternion() {
    const quaternion = new THREE.Quaternion()

    quaternion.setFromRotationMatrix(this.worldMatrix4)

    return quaternion
  }

  get position() {
    return this.localToWorld(this.localPosition)
  }

  set position(position: THREE.Vector3) {
    this.localPosition.copy(this.worldToLocal(position))
  }

  get rotation() {
    return this.localToWorld(this.localRotation)
  }

  set rotation(rotation: THREE.Quaternion) {
    this.localRotation.copy(this.worldToLocal(rotation))
  }

  get scale() {
    return this.localToWorld(this.localScale)
  }

  set scale(scale: THREE.Vector3) {
    this.localScale.copy(this.worldToLocal(scale))
  }

  /**
   * Pseudo-property to define the events that can be emitted by the node.
   */
  declare $events: NodeEventTypes

  private _children: Node[] = []

  private _parent: Node | null = null

  private _coroutines = new Map<
    GeneratorFunction | AsyncGeneratorFunction,
    { abort: Signal; started: boolean; iterator: Generator | AsyncGenerator }
  >()

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
        | ((
            listener: NodeEventListener<EventName, This['$events'][EventName]>
          ) => void),
      context: ClassMethodDecoratorContext<
        any,
        (
          this: This,
          e: This['$events'][EventName]
        ) =>
          | void
          | ((
              listener: NodeEventListener<EventName, This['$events'][EventName]>
            ) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: NodeEventListener<EventName, This['$events'][EventName]>
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
            ;(listener as any).until(until[0], until[1])
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

  static template<T extends Class<Node>>(template: NodeTemplate) {
    return function (constructor: T, context: ClassDecoratorContext<T>) {
      context.addInitializer(function (this: T) {
        this[nodeTemplateSymbol] = template
      })
    }
  }

  constructor(props?: NodeProps) {
    this.on('update', e => {
      this._delta = e.delta
    })

    this.destroySignal.once(() => {
      this.clearListeners()
    })

    if (props) {
      if (props.name) {
        this.name = props.name
      }

      if (props.position) {
        this.localPosition.copy(
          new THREE.Vector3(
            props.position[0],
            props.position[1],
            props.position[2]
          )
        )
      }

      if (props.rotation) {
        this.localRotation.setFromEuler(
          new THREE.Euler(
            rad(props.rotation[0]),
            rad(props.rotation[1]),
            rad(props.rotation[2])
          )
        )
      }

      if (props.scale) {
        this.localScale.copy(
          new THREE.Vector3(props.scale[0], props.scale[1], props.scale[2])
        )
      }

      if (props.children) {
        props.children.forEach(child => {
          this.add(child)
        })
      }
    }

    const template = getClass(this)[nodeTemplateSymbol] as
      | NodeTemplate
      | undefined

    if (template) {
      this.add(template())
    }
  }

  localToWorld(quaternion: THREE.Quaternion): THREE.Quaternion
  localToWorld(vector: THREE.Vector3): THREE.Vector3
  localToWorld(
    vector: THREE.Vector3 | THREE.Quaternion
  ): THREE.Vector3 | THREE.Quaternion {
    if (vector instanceof THREE.Vector3) {
      return vector.applyMatrix4(this.worldMatrix4)
    } else {
      return vector.clone().premultiply(this.worldQuaternion)
    }
  }

  worldToLocal(quaternion: THREE.Quaternion): THREE.Quaternion
  worldToLocal(vector: THREE.Vector3): THREE.Vector3
  worldToLocal(
    vector: THREE.Vector3 | THREE.Quaternion
  ): THREE.Vector3 | THREE.Quaternion {
    if (vector instanceof THREE.Vector3) {
      return vector.applyMatrix4(this.worldMatrix4.invert())
    } else {
      return vector.clone().premultiply(this.worldQuaternion.invert())
    }
  }

  on<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<EventName, this['$events'][EventName]>
  ): NodeEventListener<EventName, this['$events'][EventName]> {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = new Set()
    }

    this._listeners[eventName]!.add(listener as any)

    return new NodeEventListener(this, eventName, listener)
  }

  once<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<EventName, this['$events'][EventName]>
  ): NodeEventListener<EventName, this['$events'][EventName]> {
    if (!this._onceListeners[eventName]) {
      this._onceListeners[eventName] = new Set()
    }

    this._onceListeners[eventName]!.add(listener as any)

    return new NodeEventListener(this, eventName, listener)
  }

  off<EventName extends keyof this['$events']>(
    eventName: EventName,
    listener: NodeEventCallback<EventName, this['$events'][EventName]>
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
    const callListener = (listener: NodeEventCallback) => {
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

  clearListeners() {
    this._listeners = {}
    this._onceListeners = {}
  }

  wait<EventName extends keyof this['$events']>(
    eventName: EventName,
    times = 1
  ): Promise<this['$events'][EventName]> {
    return new Promise((resolve, reject) => {
      const abort = new Signal()
      abort.once(reject)
      this.destroySignal.once(() => abort.call())

      this.on(eventName, e => listener => {
        if (--times === 0) {
          listener.off()
          resolve(e)
        }
      }).until(abort)
    })
  }

  async startCoroutine(coroutine: AsyncGeneratorFunction | GeneratorFunction) {
    if (
      this._coroutines.has(coroutine) &&
      this._coroutines.get(coroutine)!.started
    ) {
      this._coroutines.get(coroutine)!.abort.call()
    }

    if (!this._coroutines.has(coroutine)) {
      this._coroutines.set(coroutine, {
        abort: new Signal(),
        iterator: (coroutine as any).call(this),
        started: true
      })
    }

    this._coroutines.get(coroutine)!.started = true

    const iterator = this._coroutines.get(coroutine)!.iterator

    let aborted = false

    const abort = () => {
      if (aborted) return

      aborted = true

      this._coroutines.get(coroutine)!.started = false
      this._coroutines.get(coroutine)!.abort.off(abort)
      this._coroutines.get(coroutine)!.iterator.return(null)
      this._coroutines.get(coroutine)!.abort.clear()
      this._coroutines.delete(coroutine)

      this.destroySignal.off(abort)
    }

    this._coroutines.get(coroutine)!.abort.once(abort)

    this.destroySignal.once(abort)

    let done = false

    do {
      if (aborted) {
        break
      }

      const result = await (iterator.next() as unknown as Promise<any>).catch(
        abort
      )

      if (aborted) {
        break
      }

      if (result.value instanceof Promise) {
        await result.value.catch(abort)
      } else if (result.value === null) {
        await this.wait('update').catch(abort)
      }

      done = result.done || result.value === undefined
    } while (!done)
  }

  stopCoroutine(coroutine: GeneratorFunction) {
    if (!this._coroutines.has(coroutine)) return

    this._coroutines.get(coroutine)!.abort.call()
  }

  @bound
  destroy() {
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

  add(node: Node): void
  add(nodes: Node[]): void
  add(node: Node | Node[]): void
  add(node: Node | Node[]): void {
    if (Array.isArray(node)) {
      node.forEach(child => this.add(child))
    } else {
      node.parent = this
    }
  }

  create(): NodeTemplate | void {
    return () => []
  }
}
