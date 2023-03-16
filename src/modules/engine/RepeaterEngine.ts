import { Class, Clock, bound } from 'aureamorum'
import EventEmitter from 'eventemitter3'
import { RepeaterPlugin } from '.'
import { PlanckPlugin } from '../physics-planck'
import { RenderPlugin } from '../render'
import { Node, NodeEvent } from '../node'

export interface RepeaterEngineOptions {
  plugins?: Class<RepeaterPlugin>[]
}

export class RepeaterEngine extends EventEmitter {
  clock: Clock

  root: Node

  plugins: RepeaterPlugin[] = []

  constructor(options: RepeaterEngineOptions = {}) {
    super()

    this.clock = new Clock()

    this.root = new Node()

    if (options.plugins) {
      this.plugins = options.plugins.map(Plugin => {
        const p = new Plugin()
        p.engine = this

        return p
      })
    }
  }

  start() {
    this.initializePlugins()
    this.clock.on('update', this.update)
    this.clock.on('fixedUpdate', this.fixedUpdate)
    this.clock.start()
  }

  private initializePlugins() {
    this.plugins.forEach(plugin => {
      plugin.load()
    })
    this.plugins.forEach(plugin => {
      plugin.init()
    })
  }

  @bound
  private update() {
    this.root.emitDown(
      'update',
      Object.assign(new NodeEvent(), {
        time: this.clock.time,
        delta: this.clock.delta
      })
    )
  }

  @bound
  private fixedUpdate() {
    this.root.emitDown(
      'fixedUpdate',
      Object.assign(new NodeEvent(), {
        time: this.clock.time
      })
    )
  }
}

export const engine = new RepeaterEngine({
  plugins: [PlanckPlugin, RenderPlugin]
})
