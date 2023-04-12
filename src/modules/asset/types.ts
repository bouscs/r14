import { AssetManager } from './AssetManager'

declare module '../engine' {
  interface RepeaterEngine {
    assets: AssetManager
  }
}

export interface AssetTypes {}

export type AssetType = keyof AssetTypes

export interface AssetTypeOptions extends Record<AssetType, any> {}
