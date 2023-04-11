import { AssetManager } from './AssetManager'

declare module '../engine' {
  interface RepeaterEngine {
    assets: AssetManager
  }
}
