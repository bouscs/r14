import { Class, EventEmitter, Signal, bound, getClass, rad } from 'aureamorum'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'
import {
  AnyNode,
  FixedUpdateEvent,
  GetEvents,
  NodeEventCallback,
  NodeTemplate,
  UpdateEvent
} from './types'
import * as THREE from 'three'
import { Component, EulerSimple, Vector3Simple } from '..'
import { JSX } from 'r14-h/jsx-runtime'

export type NodeProps<T extends Node = Node> = {
  name?: string | symbol
  position?: Vector3Simple
  rotation?: EulerSimple
  scale?: Vector3Simple

  children?: Node[]

  components?: (() => T['$components'])[]
} & {
  [Key in keyof Omit<T['$events'], symbol> as `on:${Key}`]?: NodeEventCallback<
    T['$events'][Key]
  >
} & {
  [Key in keyof Omit<
    T['$events'],
    symbol
  > as `once:${Key}`]?: NodeEventCallback<T['$events'][Key]>
}

export const nodeTemplateSymbol = Symbol('nodeTemplate')

export class Node {
  readonly id = Symbol('Node')

  destroySignal = new Signal({ once: true })

  name: string | symbol = 'Node'

  props: NodeProps<this>

  readonly components: this['$components'][] = []

  private _children: Node[] = []
  timeScale = 1

  private _delta = 0

  get delta() {
    return this._delta * this.timeScale * (this.parent?.timeScale ?? 1)
  }

  localPosition = new THREE.Vector3()

  localRotation = new THREE.Quaternion()

  localScale = new THREE.Vector3(1, 1, 1)

  private _localMatrix = new THREE.Matrix4()
  get localMatrix() {
    return this._localMatrix
  }

  @bound
  updateLocalMatrix() {
    this._localMatrix = new THREE.Matrix4().compose(
      this.localPosition,
      this.localRotation,
      this.localScale
    )
  }

  get worldMatrix(): THREE.Matrix4 {
    if (this.parent) {
      return new THREE.Matrix4().multiplyMatrices(
        this.parent.worldMatrix,
        this.parent.localMatrix.clone()
      )
    }

    return new THREE.Matrix4()
  }

  get worldQuaternion() {
    const quaternion = new THREE.Quaternion()

    quaternion.setFromRotationMatrix(this.worldMatrix)

    return quaternion
  }

  get position() {
    return this.localToWorld(this.localPosition)
  }

  set position(position: THREE.Vector3) {
    this.localPosition = this.worldToLocal(position)
  }

  get rotation() {
    return this.localToWorld(this.localRotation)
  }

  set rotation(rotation: THREE.Quaternion) {
    this.localRotation = this.worldToLocal(rotation)
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
  declare $events: unknown

  declare $components: Component

  private _parent: Node | null = null

  private _coroutines = new Map<
    GeneratorFunction | AsyncGeneratorFunction,
    { abort: Signal; started: boolean; iterator: Generator | AsyncGenerator }
  >()

  private _listeners: {
    [K in keyof GetEvents<this>]?: Set<NodeEventCallback<any>>
  } = {}

  private _onceListeners: {
    [K in keyof GetEvents<this>]?: Set<NodeEventCallback<any>>
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
  static on<This extends Node, EventName extends keyof GetEvents<This>>(
    event: EventName,
    options: {
      once?: boolean
      until?: (this: This) => Signal | [EventEmitter, string]
    } = {}
  ) {
    return (
      originalMethod: (
        this: This,
        e: GetEvents<This>[EventName]
      ) => void | ((listener: NodeEventListener) => void),
      context: ClassMethodDecoratorContext<
        This,
        (
          this: This,
          e: GetEvents<This>[EventName]
        ) => void | ((listener: NodeEventListener) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: NodeEventListener
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

  /**
   * Define the children of the node when the node is initialized.
   */
  static template<T extends Class<Node>>(template: () => JSX.Element) {
    return function (constructor: T, context: ClassDecoratorContext<T>) {
      context.addInitializer(function (this: T) {
        this[nodeTemplateSymbol] = template
      })
    }
  }

  /**
   * Create a component and add it to the node when the node is initialized.
   */
  static component<This extends Node, ComponentClass extends Class<Component>>(
    componentClass: ComponentClass,
    props:
      | ConstructorParameters<ComponentClass>[1]
      | ((this: This) => ConstructorParameters<ComponentClass>[1]) = {} as any
  ) {
    return function (
      _: any,
      context: ClassAccessorDecoratorContext<This, InstanceType<ComponentClass>>
    ) {
      context.addInitializer(function (this: This) {
        this.once('awake', () => {
          if (typeof props === 'function') {
            props = (
              props as (this: This) => ConstructorParameters<ComponentClass>[1]
            ).call(this)
          }
          const component = new componentClass(this, props)

          Object.defineProperty(this, context.name, {
            value: component,
            writable: false
          })
        })
      })
    }
  }

  constructor(props?: NodeProps<Node>) {
    this.props = props || ({} as any)
    const onUpdate = ((e: UpdateEvent) => {
      this._delta = e.delta
    }).bind(this)

    const onFixedUpdate = ((e: FixedUpdateEvent) => {
      this.updateLocalMatrix()
    }).bind(this)

    this.on('update', onUpdate)
    this.on('fixedUpdate', onFixedUpdate)

    // Update matrix
    this.updateLocalMatrix()

    // Handle props
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
        if (Array.isArray(props.children)) {
          props.children.forEach(child => {
            this.add(child)
          })
        } else {
          this.add(props.children)
        }
      }

      // Handle "on:" props
      Object.keys(props)
        .filter(key => key.startsWith('on:'))
        .map(key => key.slice(3))
        .forEach(callback => {
          this.on(callback as any, props[`on:${callback}`]!.bind(this)! as any)
        })

      // Handle "once:" props
      Object.keys(props)
        .filter(key => key.startsWith('once:'))
        .map(key => key.slice(5))
        .forEach(callback => {
          this.once(
            callback as any,
            props[`once:${callback}`]!.bind(this)! as any
          )
        })

      // Handle component props
      if (props.components) {
        props.components.forEach(f => {
          f.call(this)
        })
      }
    }

    // Handle creating template children
    const template = getClass(this)[nodeTemplateSymbol] as
      | ((this: this) => NodeTemplate)
      | undefined

    if (template) {
      this.add(template.call(this)())
    }

    // Queue awake event
    queueMicrotask(() => {
      this.emit('awake', new NodeEvent())

      queueMicrotask(() => {
        this.emit('start', new NodeEvent())
      })
    })
  }

  localToWorld(quaternion: THREE.Quaternion): THREE.Quaternion
  localToWorld(vector: THREE.Vector3): THREE.Vector3
  localToWorld(
    arg: THREE.Vector3 | THREE.Quaternion
  ): THREE.Vector3 | THREE.Quaternion {
    if (arg instanceof THREE.Vector3) {
      return arg.clone().applyMatrix4(this.worldMatrix)
    } else {
      return arg.clone().premultiply(this.worldQuaternion)
    }
  }

  worldToLocal(quaternion: THREE.Quaternion): THREE.Quaternion
  worldToLocal(vector: THREE.Vector3): THREE.Vector3
  worldToLocal(
    arg: THREE.Vector3 | THREE.Quaternion
  ): THREE.Vector3 | THREE.Quaternion {
    if (arg instanceof THREE.Vector3) {
      return arg.clone().applyMatrix4(this.worldMatrix.clone().invert())
    } else {
      return arg.clone().premultiply(this.worldQuaternion.clone().invert())
    }
  }

  on<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    listener: NodeEventCallback<GetEvents<this>[EventName]>
  ): NodeEventListener {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = new Set()
    }

    this._listeners[eventName]!.add(listener as any)

    return new NodeEventListener(this, eventName, listener)
  }

  once<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    listener: NodeEventCallback<GetEvents<this>[EventName]>
  ): NodeEventListener {
    if (!this._onceListeners[eventName]) {
      this._onceListeners[eventName] = new Set()
    }

    this._onceListeners[eventName]!.add(listener as any)

    return new NodeEventListener(this, eventName, listener)
  }

  off<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    listener: NodeEventCallback<GetEvents<this>[EventName]>
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

  emit<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    e: GetEvents<this>[EventName]
  ): void
  emit(eventName: string, e: NodeEvent): void
  emit(eventName: string, e: any) {
    const callListener = (listener: NodeEventCallback) => {
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

  emitDown<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    e: GetEvents<this>[EventName]
  ): void
  emitDown(eventName: string, e: NodeEvent): void
  emitDown(eventName: string, e: any) {
    this.emit(eventName, e)

    if (e.stoppedPropagation) return

    this.children.forEach(child => child.emitDown(eventName, e))
  }

  emitUp<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    e: GetEvents<this>[EventName]
  ): void
  emitUp(eventName: string, e: NodeEvent): void
  emitUp(eventName: string, e: any) {
    this.emit(eventName, e)

    if (e.stoppedPropagation) return

    if (this.parent) {
      this.parent.emitUp(eventName, e)
    }
  }

  clearListeners() {
    this._listeners = {}
    this._onceListeners = {}
  }

  wait<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    times = 1
  ): Promise<GetEvents<this>[EventName]> {
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

  coroutineStarted(coroutine: GeneratorFunction) {
    return this._coroutines.has(coroutine)
  }

  @bound
  destroy() {
    this.destroySignal.call()

    this.children.forEach(child => child.destroy())

    this.clearListeners()
  }

  find(nodeClass: Class<Node>): Node
  find(name: string | symbol): Node
  find(arg0: string | symbol | Class<Node>): Node {
    if (typeof arg0 === 'string' || typeof arg0 === 'symbol') {
      const child = this.children.find(child => child.name === arg0)!

      if (child) {
        return child
      }

      return this.children.find(child => child.find(arg0))!
    }

    const child = this.children.find(child => child instanceof arg0)!

    if (child) {
      return child
    }

    return this.children.find(child => child.find(arg0))!
  }

  add(node: JSX.Element): void
  add(node: Node): void
  add(nodes: Node[]): void
  add(node: Node | Node[]): void
  add(node: Node | Node[] | JSX.Element): void {
    if (typeof node === 'function') {
      node = node() as any
    }
    if (Array.isArray(node)) {
      node.forEach(child => this.add(child))
    } else {
      ;(node as any).parent = this
    }
  }

  getComponent<T extends Class<this['$components']>>(componentClass: T) {
    return this.components.find(
      (component: any) => component instanceof componentClass
    )! as InstanceType<T>
  }
}
