import { RepeaterPlugin } from '../engine'
import { MouseEventsManager } from './MouseEventsManager'

declare module '../engine' {
  interface RepeaterEngine {
    mouseEvents: MouseEventsManager
  }
}

export class MouseEventsPlugin extends RepeaterPlugin {
  load() {
    this.engine.mouseEvents = new MouseEventsManager()
  }
}
