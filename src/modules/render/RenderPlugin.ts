import { RepeaterPlugin } from '../engine'
import { RenderManager } from './RenderManager'

declare module '../engine/RepeaterEngine' {
  interface RepeaterEngine {
    render: RenderManager
  }
}

export class RenderPlugin extends RepeaterPlugin {
  load() {
    this.engine.render = new RenderManager()
  }
}
