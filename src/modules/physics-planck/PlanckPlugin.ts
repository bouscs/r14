import { RepeaterPlugin } from '../engine/RepeaterPlugin'
import { PlanckManager } from './PlanckManager'

declare module '../engine/RepeaterEngine' {
  interface RepeaterEngine {
    planck: PlanckManager
  }
}

export class PlanckPlugin extends RepeaterPlugin {
  load() {
    this.engine.planck = new PlanckManager()
  }
}
