import { RepeaterEngine } from './RepeaterEngine'

export abstract class RepeaterPlugin {
  engine!: RepeaterEngine

  load() {}

  init() {}
}
