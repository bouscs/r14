import { RepeaterPlugin, engine } from '../engine'
import { AssetManager } from './AssetManager'

export class AssetPlugin extends RepeaterPlugin {
  load(): void {
    engine.assets = new AssetManager()
  }
}
