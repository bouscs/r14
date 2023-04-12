import { RepeaterPlugin } from '../engine'
import { AssetManager } from './AssetManager'

export * from './types'
export * from './Asset'
export * from './AssetManager'
export * from './loaders'

export class AssetPlugin extends RepeaterPlugin {
  load(): void {
    this.engine.assets = new AssetManager()
  }
}
