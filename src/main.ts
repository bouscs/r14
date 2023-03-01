import { RepeaterEngine } from './modules/engine'
import { Signal } from 'aureamorum'
import {
  FixedUpdateEvent,
  Node,
  NodeEvent,
  NodeEventListener
} from '$modules/node'

const el = document.querySelector<HTMLDivElement>('#app')!

console.log('Hello from Vite!')

const engine = new RepeaterEngine()

let fixedUpdates = 0
const sig = new Signal()

class MyNode extends Node {
  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    console.log('fixedUpdate', e.time)

    return (listener: NodeEventListener) => {
      if (e.time >= 240) {
        listener.off()
      }
    }
  }
}

const node = new MyNode()

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
