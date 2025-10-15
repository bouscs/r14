import {
  engine,
  FixedUpdateEvent,
  Node,
  NodeEvent,
  NodeProps,
  Plane,
  Body2D,
  CircleCollider2D,
  Camera,
  CameraBoundsCollider,
  Sprite,
  Interactive,
  PointerNodeEvent
} from 'repeater14'
import { Signal, trait } from 'bouscs-util'
import * as THREE from 'three'
import * as planck from 'planck'

console.log(engine)
const renderer = trait<{
  render(): void
}>()

let fixedUpdates = 0
const sig = new Signal()

class ChildNode extends Node {
  name = 'child'

  declare $events: Node['$events'] & {
    childEvent: NodeEvent
  }

  @Node.on('childEvent')
  childEvent(e: NodeEvent) {
    console.log('childEvent', e)
  }
}

class MyNode extends Node {
  declare $events: Node['$events'] & {
    childEvent: NodeEvent
  }

  @Node.child('child')
  accessor child: ChildNode

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
    <Sprite
      material={{
        texture: {
          imageAsset: 'carroAzul'
        },
        transparency: true
      }}
    />
    <Node name="head">
      <Node name="camera" />
    </Node>
    <Node name="gun" />
  </>
))
class Player extends Node {
  declare $events: Interactive['$events']

  declare $components: Body2D | CircleCollider2D

  @Node.child('head')
  accessor head: Node

  @Node.child(Sprite)
  accessor sprite: Sprite

  @Node.child('camera')
  accessor camera: Node

  @Node.child('gun')
  accessor gun: Node

  @Node.component(Body2D, { type: 'dynamic' })
  accessor body: Body2D

  @Node.component(CircleCollider2D, { radius: 1.1 })
  accessor collider: CircleCollider2D
}

class Spinner extends Node {
  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    this.rotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, e.time / 1000)
    )
  }
}

@Node.template(() => (
  <>
    <Player position={[0, 0, 0]} rotation={[0, 0, 30]} />

    <Camera
      mode="orthographic"
      width={16}
      height={12}
      position={[0, 0, 5]}
      main
    >
      <CameraBoundsCollider />
    </Camera>

    <Plane name="interactable" width={100} height={100} interactive />

    <Plane
      name="background"
      position={[0, 0, -1]}
      width={100}
      height={100}
      material={{
        color: 0x444444
      }}
    />
  </>
))
class GameNode extends Node {
  declare $events: Interactive['$events']

  @Node.child(Player)
  accessor player!: Player

  @Node.child(Camera)
  accessor camera!: Camera

  @Node.child('interactable')
  accessor interactable!: Plane

  isPointerDown = false
  pointerPosition = new THREE.Vector2()

  @Node.on('dragStart')
  onPointerDown(e: PointerNodeEvent) {
    this.isPointerDown = true
    this.pointerPosition.set(e.pointerX, e.pointerY)
  }

  @Node.on('drag')
  onPointerMove(e: PointerNodeEvent) {
    this.pointerPosition.set(e.pointerX, e.pointerY)
  }

  @Node.on('dragEnd')
  onPointerUp() {
    this.isPointerDown = false
  }

  @Node.on('fixedUpdate')
  fixedUpdate() {
    if (this.isPointerDown) {
      const worldPosition = this.camera.pointToWorld(this.pointerPosition)

      this.player.body.body.applyForce(
        planck.Vec2(
          20 * (worldPosition.x - this.player.position.x),
          20 * (worldPosition.y - this.player.position.y)
        ),
        planck.Vec2(this.player.position.x, this.player.position.y)
      )
    }
  }

  @Node.on('start')
  start() {
    renderer.of(this).render()
  }
}

@renderer.for(Node)
class NodeRenderer {
  render() {
    console.log('rendering node')
  }
}

const start = async () => {
  engine.start()
  await engine.assets.load({
    image: {
      carroAzul: {
        src: '/carroAzul.png'
      }
    }
  })
  engine.root.add(new GameNode())
}

start()
