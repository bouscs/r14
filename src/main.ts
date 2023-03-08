import { RepeaterEngine } from './modules/engine'
import { Signal } from 'aureamorum'
import {
  FixedUpdateEvent,
  Node,
  NodeEvent,
  NodeEventListener,
  NodeEventTypes
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

  constructor() {
    super()
    this.add(new ChildNode() as any)

    this.go()
  }

  async go() {
    await this.wait('fixedUpdate', 120)
    console.log('waited 120')
  }

  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    //console.log('fixedUpdate', e.time)

    return (listener: NodeEventListener) => {
      if (e.time >= 240) {
        listener.off()
      }
    }
  }
}

const node = new MyNode()
console.log(node)
console.log(node.child)

node.emit('childEvent', new NodeEvent())

engine.clock.fixedUpdateSignal
  .on(time => listener => {
    fixedUpdates++
    el.innerHTML = String(Math.floor(fixedUpdates / 60))
    node.emit(
      'fixedUpdate',
      Object.assign(new NodeEvent(), { time, type: 'fixedUpdate' })
    )
  })
  .until(sig)
  .then(() => {
    console.log('finished')
    return sig
  })
  .then(async () => {
    console.log('finished2')

    await sig
    console.log('finished3')

    engine.clock.stop()
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
