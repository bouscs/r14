import { RepeaterEngine } from './modules'
import { Signal } from 'aureamorum'
import {
  FixedUpdateEvent,
  Node,
  NodeEvent,
  NodeEventListener,
  NodeEventTypes,
  NodeProps
} from '$modules/node'

const el = document.querySelector<HTMLDivElement>('#app')!

const engine = new RepeaterEngine()

let fixedUpdates = 0
const sig = new Signal()

class ChildNode extends Node {
  name = 'child'

  declare $events: NodeEventTypes & {
    childEvent: NodeEvent
  }

  @Node.on<ChildNode, 'childEvent'>('childEvent')
  childEvent(e: NodeEvent) {
    console.log('childEvent', e)
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
    console.log('waited 120')

    this.startCoroutine(this.gen)
  }

  gen = function* (this: MyNode) {
    console.log('gen start')
    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')

    yield* this.gen2()

    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen waited 120')
  } as GeneratorFunction

  gen2 = function* (this: MyNode) {
    console.log('gen2 start')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
    yield this.wait('fixedUpdate', 120)
    console.log('gen2 waited 120')
  } as GeneratorFunction

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
console.log(node)
console.log(node.child)

node.emit('childEvent', new NodeEvent())

engine.clock.fixedUpdateSignal
  .on(time => listener => {
    fixedUpdates++
    el.innerHTML = String(Math.floor(fixedUpdates / 60))
  })
  .until(sig)
  .then(() => {
    console.log('finished')

    return sig
  })
  .then(async () => {
    console.log('finished2')

    node.startCoroutine(node.gen)

    await sig
    console.log('finished3')

    // engine.clock.stop()
  })

engine.clock.fixedUpdateSignal.on(time => listener => {
  node.emit(
    'fixedUpdate',
    Object.assign(new NodeEvent(), { time, type: 'fixedUpdate' })
  )

  if (time > 900) {
    node.destroy()
    listener.off()
  }
})

setTimeout(() => {
  console.log('calling')
  sig.call()

  setTimeout(() => {
    console.log('calling again')
    sig.call()

    setTimeout(() => {
      console.log('calling again again')
      sig.call()
    }, 1000)
  }, 2000)
}, 5000)

engine.clock.start()
