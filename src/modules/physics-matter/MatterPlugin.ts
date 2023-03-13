import { RepeaterPlugin } from '..'
import { MatterManager } from './MatterManager'

declare module '../engine/RepeaterEngine' {
  interface RepeaterEngine {
    matter: MatterManager
  }
}

export class MatterPlugin extends RepeaterPlugin {
  load() {
    console.log('MatterPlugin loaded')
    this.engine.matter = new MatterManager(this.engine)
  }
}
