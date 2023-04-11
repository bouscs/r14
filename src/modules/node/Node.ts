import {
  Class,
  EventEmitter,
  Signal,
  bound,
  cached,
  getClass,
  rad,
  refreshCached
} from 'aureamorum'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'
import {
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
  [Key in keyof Omit<GetEvents<T>, symbol> as `on:${Key}`]?: NodeEventCallback<
    GetEvents<T>[Key]
  >
} & {
  [Key in keyof Omit<
    GetEvents<T>,
    symbol
  > as `once:${Key}`]?: NodeEventCallback<GetEvents<T>[Key]>
}

export const nodeTemplateSymbol = Symbol('nodeTemplate')

export class Node<Components extends Component = Component, Events = unknown> {
  id = Symbol('Node')

  /**
   * Pseudo-property to define the events that can be emitted by the node.
   */
  declare $events: Events

  declare $components: Components

  destroySignal = new Signal({ once: true })

  name: string | symbol = 'Node'

  props: any

  readonly components: this['$components'][] = []

  private _children: Node[] = []
  timeScale = 1

  private _delta = 0

  get delta() {
    return this._delta * this.timeScale * (this.parent?.timeScale ?? 1)
  }

  private _localPosition = new THREE.Vector3()

  get localPosition() {
    const pos = this._localPosition.clone()

    const node = this

    let _x = pos.x
    let _y = pos.y
    let _z = pos.z

    return Object.assign(pos, {
      get x() {
        return _x
      },
      set x(x: number) {
        _x = x
        node.localPosition = new THREE.Vector3(x, this.y, this.z)
      },
      get y() {
        return _y
      },
      set y(y: number) {
        _y = y
        node.localPosition = new THREE.Vector3(this.x, y, this.z)
      },
      get z() {
        return _z
      },
      set z(z: number) {
        _z = z
        node.localPosition = new THREE.Vector3(this.x, this.y, z)
      }
    })
  }

  @Node.watch
  set localPosition(position: THREE.Vector3) {
    this._localPosition = position
  }

  @Node.watch
  accessor localRotation = new THREE.Quaternion()

  private _localScale = new THREE.Vector3(1, 1, 1)

  get localScale() {
    const scale = this._localScale

    const node = this

    let _x = scale.x
    let _y = scale.y
    let _z = scale.z

    return Object.assign(scale, {
      get x() {
        return _x
      },
      set x(x: number) {
        _x = x
        node._localScale = new THREE.Vector3(x, scale.y, scale.z)
      },
      set y(y: number) {
        _y = y
        node._localScale = new THREE.Vector3(scale.x, y, scale.z)
      },
      get y() {
        return _y
      },
      get z() {
        return _z
      },
      set z(z: number) {
        _z = z
        node._localScale = new THREE.Vector3(scale.x, scale.y, z)
      }
    })
  }

  @Node.watch
  set localScale(scale: THREE.Vector3) {
    this._localScale = scale
  }

  @cached
  get localMatrix() {
    return new THREE.Matrix4().compose(
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
    const pos = this.localToWorld(this.localPosition)

    const node = this

    let _x = pos.x
    let _y = pos.y
    let _z = pos.z

    Object.defineProperties(pos, {
      x: {
        get() {
          return _x
        },
        set(x: number) {
          _x = x

          node.localPosition = node.worldToLocal(pos)
        }
      },
      y: {
        get() {
          return _y
        },
        set(y: number) {
          _y = y

          node.localPosition = node.worldToLocal(pos)
        }
      },
      z: {
        get() {
          return _z
        },
        set(z: number) {
          _z = z

          node.localPosition = node.worldToLocal(pos)
        }
      }
    })

    return pos
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
    const scale = this.localToWorld(this.localScale)

    const node = this

    let _x = scale.x
    let _y = scale.y
    let _z = scale.z

    return Object.assign(scale, {
      get x() {
        return _x
      },
      set x(x: number) {
        _x = x

        node.localScale = node.worldToLocal(this as unknown as THREE.Vector3)
      },
      get y() {
        return _y
      },
      set y(y: number) {
        _y = y

        node.localScale = node.worldToLocal(this as unknown as THREE.Vector3)
      },
      get z() {
        return _z
      },
      set z(z: number) {
        _z = z

        node.localScale = node.worldToLocal(this as unknown as THREE.Vector3)
      }
    })
  }

  set scale(scale: THREE.Vector3) {
    this.localScale = this.worldToLocal(scale)
  }

  private _parent: Node | null = null

  private _coroutines = new Map<
    GeneratorFunction | AsyncGeneratorFunction,
    { abort: Signal; started: boolean; iterator: Generator | AsyncGenerator }
  >()

  private _listeners: {
    [K in keyof GetEvents<this>]?: Set<NodeEventCallback>
  } = {}

  private _onceListeners: {
    [K in keyof GetEvents<this>]?: Set<NodeEventCallback>
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

    this.emit('parentChanged', Object.assign(new NodeEvent(), { parent }))

    if (this._parent) {
      this._parent._children.push(this)
      this.emitUp(
        'add',
        Object.assign(new NodeEvent(), {
          child: this,
          parent: this._parent
        }) as GetEvents<this>['add']
      )
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
        if (options.once === true) {
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
   * Add method as a once-listener to the given event when the node is initialized. The listener will be removed when the node is destroyed.
   */
  static once<This extends Node, EventName extends keyof GetEvents<This>>(
    event: EventName,
    options: {
      until?: (this: This) => Signal | [EventEmitter, string]
    } = {}
  ) {
    return Node.on(event, { ...options, once: true })
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

  static parent() {
    return function <This extends Node, Value extends Node>(
      _: any,
      context: ClassAccessorDecoratorContext<This, Value>
    ) {
      context.addInitializer(function (this: This) {
        this.once('parentChanged', e => {
          Object.defineProperty(this, context.name, {
            value: e.parent,
            writable: false
          })
        })
      })
    }
  }

  /**
   * Define the children of the node when the node is initialized.
   */
  static template<T extends Class<Node>>(
    template: (this: InstanceType<T>) => JSX.Element
  ) {
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

  static watch<This extends Node, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value>
  static watch<This extends Node, Value>(
    target: (this: This, value: Value) => void,
    context: ClassSetterDecoratorContext
  ): (this: This, value: Value) => void
  static watch<This extends Node, Value>(
    target:
      | ClassAccessorDecoratorTarget<This, Value>
      | ((this: This, value: Value) => void),
    context:
      | ClassAccessorDecoratorContext<This, Value>
      | ClassSetterDecoratorContext<This, Value>
  ):
    | ClassAccessorDecoratorResult<This, Value>
    | ((this: This, value: Value) => void) {
    if (context.kind === 'setter') {
      return function (this: This, value: Value) {
        const previous = this[context.name]

        this.emit(
          `set(${context.name as string})`,
          Object.assign(new NodeEvent(), {
            value,
            previous
          } as any)
        )
        ;(target as (this: This, value: Value) => void).call(this, value)
      }
    } else {
      return {
        get(this: This) {
          return (target as ClassAccessorDecoratorTarget<This, Value>).get.call(
            this
          )
        },
        set(this: This, value: Value) {
          const _target = target as ClassAccessorDecoratorTarget<This, Value>

          const previous = _target.get.call(this)

          this.emit(
            `set(${context.name as string})`,
            Object.assign(new NodeEvent(), {
              value,
              previous
            } as any)
          )

          _target.set.call(this, value)
        }
      }
    }
  }

  constructor(props?: NodeProps<Node<Components, Events>>) {
    this.props = props || ({} as any)

    const onUpdate = ((e: UpdateEvent) => {
      this._delta = e.delta
    }).bind(this)

    const onPreUpdate = (() => {
      refreshCached(this, 'localMatrix')
    }).bind(this)

    this.on('preUpdate', onPreUpdate)
    this.on('update', onUpdate)

    // Handle props
    if (props) {
      // Handle name props
      if (props.name) {
        this.name = props.name
      }

      // Handle position props
      if (props.position) {
        this.localPosition = new THREE.Vector3(
          props.position[0],
          props.position[1],
          props.position[2]
        )
      }

      // Handle rotation props
      if (props.rotation) {
        this.localRotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            rad(props.rotation[0]),
            rad(props.rotation[1]),
            rad(props.rotation[2])
          )
        )
      }

      // Handle scale props
      if (props.scale) {
        this.localScale = new THREE.Vector3(
          props.scale[0],
          props.scale[1],
          props.scale[2]
        )
      }

      // Handle children props
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
          console.log(callback, props)
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
      return arg.clone().applyMatrix4(this.worldMatrix.clone())
    } else {
      return arg.clone().premultiply(this.worldQuaternion.clone())
    }
  }

  worldToLocal(quaternion: THREE.Quaternion): THREE.Quaternion
  worldToLocal(vector: THREE.Vector3): THREE.Vector3
  worldToLocal(
    arg: THREE.Vector3 | THREE.Quaternion
  ): THREE.Vector3 | THREE.Quaternion {
    if (arg instanceof THREE.Vector3) {
      return arg.clone().applyMatrix4(this.worldMatrix.clone().invert())
    } else if (arg instanceof THREE.Quaternion) {
      return arg.clone().premultiply(this.worldQuaternion.clone().invert())
    } else {
      throw new Error('Invalid argument')
    }
  }

  directionToWorld(vector: THREE.Vector3) {
    return new THREE.Vector3().setFromMatrixPosition(
      new THREE.Matrix4()
        .compose(vector, new THREE.Quaternion(), new THREE.Vector3())
        .multiply(this.worldMatrix.clone())
    )
  }

  directionToLocal(vector: THREE.Vector3) {
    return new THREE.Vector3().setFromMatrixPosition(
      new THREE.Matrix4()
        .compose(vector, new THREE.Quaternion(), new THREE.Vector3())
        .multiply(this.worldMatrix.clone().invert())
    )
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
  ) {
    if (!e.target) {
      e.target = this
    }

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
  ) {
    this.emit(eventName, e)

    if ((e as NodeEvent).stoppedPropagation) return

    this.children.forEach(child => child.emitDown(eventName as any, e as any))
  }

  emitUp<EventName extends keyof GetEvents<this>>(
    eventName: EventName,
    e: GetEvents<this>[EventName]
  ) {
    this.emit(eventName, e)

    if ((e as NodeEvent).stoppedPropagation) return

    if (this.parent) {
      this.parent.emitUp(eventName as any, e as any)
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
  add(...nodes: JSX.Element[]): void
  add(node: Node | Node[]): void
  add(node: Node | Node[] | JSX.Element): void {
    if (Array.isArray(arguments)) {
      ;(arguments as unknown as Node[]).forEach(arg => this.add(arg))
      return
    }
    if (typeof node === 'function') {
      node = node() as any
    }
    if (Array.isArray(node)) {
      node.forEach(child => this.add(child))
    } else {
      ;(node as any).parent = this
    }
  }

  getComponent<T extends Class<this['$components']>>(
    componentClass: T
  ): InstanceType<T> {
    return this.components.find(
      (component: any) => component instanceof componentClass
    )! as InstanceType<T>
  }
}
