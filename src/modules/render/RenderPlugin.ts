import { RepeaterPlugin } from '../engine'
import { RenderManager } from './RenderManager'

declare module '../engine' {
  interface RepeaterEngine {
    render: RenderManager
  }
}

export class RenderPlugin extends RepeaterPlugin {
  load() {
    this.engine.render = new RenderManager()
  }
}
