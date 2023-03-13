import { EventEmitter } from 'aureamorum'
import * as THREE from 'three'

export interface Vector3Events {
  'set(x)': (value: number, previous: number) => void
  'set(y)': (value: number, previous: number) => void
  'set(z)': (value: number, previous: number) => void
}

export class Vector3 {
  events = new EventEmitter<Vector3Events>()

  private _v: THREE.Vector3

  get _x() {
    return this._v.x
  }

  set _x(value: number) {
    this._v.x = value
  }

  get _y() {
    return this._v.y
  }

  set _y(value: number) {
    this._v.y = value
  }

  get _z() {
    return this._v.z
  }

  set _z(value: number) {
    this._v.z = value
  }

  get x() {
    return this._x
  }

  set x(value: number) {
    const previous = this._x
    this._x = value
    this.events.emit('set(x)', value, previous)
  }

  get y() {
    return this._y
  }

  set y(value: number) {
    const previous = this._y
    this._y = value
    this.events.emit('set(y)', value, previous)
  }

  get z() {
    return this._z
  }

  set z(value: number) {
    const previous = this._z
    this._z = value
    this.events.emit('set(z)', value, previous)
  }

  constructor(v: Vector3)
  constructor(x?: number, y?: number, z?: number)
  constructor(...args: any[]) {
    this._v = new THREE.Vector3()

    if (args.length === 1 && args[0] instanceof Vector3) {
      this._x = args[0]._x
      this._y = args[0]._y
      this._z = args[0]._z
    } else {
      args = args.map(arg => arg || 0)

      this._x = args[0]
      this._y = args[1]
      this._z = args[2]
    }
  }
}
