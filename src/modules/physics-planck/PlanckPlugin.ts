import { RepeaterPlugin } from '../engine'
import { PlanckManager } from './PlanckManager'

declare module '../engine' {
  interface RepeaterEngine {
    planck: PlanckManager
  }
}

export class PlanckPlugin extends RepeaterPlugin {
  load() {
    this.engine.planck = new PlanckManager()
  }
}
