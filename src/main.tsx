import { Component, engine } from './modules'
import { Signal } from 'aureamorum'
import {
  FixedUpdateEvent,
  Node,
  NodeEvent,
  NodeEventTypes,
  NodeProps
} from './modules'
import { Body2D } from './modules/physics/Body2D'
import { Camera } from './modules/camera'
import { Sprite } from './modules/sprite'
import { Interactive, PointerNodeEvent } from './modules/interactive'
import * as THREE from 'three'
import * as planck from 'planck'
import { CircleCollider2D } from './modules/physics/CircleCollider2D'
import { CameraBounds } from './modules/camera/CameraBounds'

console.log(engine)

let fixedUpdates = 0
const sig = new Signal()

class ChildNode extends Node {
  name = 'child'

  declare $events: Node['$events'] & {
    childEvent: NodeEvent
  }

  @Node.on('childEvent')
  childEvent(e: NodeEvent) {
    // console.log('childEvent', e)
  }
}

class MyNode extends Node {
  @Node.child('child')
  accessor child!: ChildNode

  constructor(props: NodeProps) {
    super(props)
    this.add(
      new ChildNode({
        position: [2, 2, 0]
      })
    )

    this.go()
  }

  async go() {
    await this.wait('fixedUpdate', 120)
    // console.log('waited 120')

    await this.startCoroutine(this.gen)

    // console.log('finished coroutine')
  }

  gen = async function* (this: MyNode) {
    // console.log('gen start')
    yield this.wait('fixedUpdate', 120)
    // console.log('gen waited 120')

    yield* this.gen2()

    yield this.wait('fixedUpdate', 120)
    // console.log('gen waited 120')
  } as AsyncGeneratorFunction

  gen2 = async function* (this: MyNode) {
    // console.log('gen2 start')
    yield this.wait('fixedUpdate', 120)
    // console.log('gen2 waited 120')
  } as AsyncGeneratorFunction

  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    //console.log('fixedUpdate', e.time)
  }
}

const node = new MyNode({
  position: [2, 2, 0],
  rotation: [90, 180, 0],
  scale: [1, 3, 1]
})
// console.log(node)
// console.log(node.child)

node.emitDown('childEvent', new NodeEvent())

engine.clock.fixedUpdateSignal
  .on(time => listener => {
    fixedUpdates++
    // el.innerHTML = String(Math.floor(fixedUpdates / 60))
  })
  .until(sig)
  .then(() => {
    // console.log('finished')

    return sig
  })
  .then(async () => {
    // console.log('finished2')

    await sig
    // console.log('finished3')

    // engine.clock.stop()
  })

engine.clock.fixedUpdateSignal.on(time => listener => {
  node.emitDown(
    'fixedUpdate',
    Object.assign(new NodeEvent(), { time, type: 'fixedUpdate' })
  )

  if (time > 900) {
    // node.destroy()
    // listener.off()
  }
})

setTimeout(() => {
  // console.log('calling')
  sig.call()

  setTimeout(() => {
    // console.log('calling again')
    sig.call()

    setTimeout(() => {
      // console.log('calling again again')
      sig.call()
    }, 1000)
  }, 2000)
}, 5000)

@Node.template(() => (
  <>
    <Sprite texture="carroAzul.png" />
    <Node name="head">
      <Node name="camera" />
    </Node>
    <Node name="gun" />
  </>
))
class Player extends Node {
  declare $events: Interactive['$events']

  @Node.child(Sprite)
  accessor sprite!: Sprite

  @Node.child('camera')
  accessor camera!: Node

  @Node.child('gun')
  accessor gun!: Node

  @Node.component(Body2D, { type: 'dynamic' })
  accessor body!: Body2D

  // @Node.component(BoxCollider2D, { width: 1, height: 1 })
  // accessor collider!: BoxCollider2D

  @Node.component(CircleCollider2D)
  accessor collider!: CircleCollider2D

  @Node.on('awake')
  awake() {
    console.log('awake')

    this.sprite.interactive.activate()
  }

  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    // console.log('fixedUpdate', e)
  }

  @Node.on('drag')
  onDrag(e: PointerNodeEvent) {
    // console.log('drag', e)
    this.body.body.applyForce(
      planck.Vec2(
        5 * e.originalEvent.movementX,
        5 * -e.originalEvent.movementY
      ),
      planck.Vec2(this.position.x, this.position.y)
    )
  }

  @Node.on('pointerDown')
  onPointerDown(e: PointerNodeEvent) {
    // console.log('pointerDown', e)
  }

  @Node.on('start')
  start() {
    console.log('start')
  }

  @Node.on('set(localPosition)')
  onPositionChange(e: NodeEvent & { value: THREE.Vector3 }) {
    // console.log('position changed', e.value)
  }
}

class Spinner extends Node {
  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    // this.rotation = new THREE.Quaternion().setFromEuler(
    //   new THREE.Euler(0, 0, e.time / 1000)
    // )
  }
}

engine.start()

engine.root.add(
  <>
    <Player position={[0, 0, 0]} rotation={[0, 0, 30]} />
    <Player position={[3, 0, 0]} rotation={[0, 0, 30]} />
    <Player position={[-3, 0, 0]} rotation={[0, 0, 30]} />

    <Spinner>
      <Camera mode="orthographic" width={16} height={12} position={[0, 0, 5]}>
        <CameraBounds />
      </Camera>
    </Spinner>
  </>
)

console.log(engine.root.children[0])
