import { Asset } from './Asset'

export class AssetManager {
  private assets: Record<string, Asset> = {}

  get<T extends Asset>(path: string) {
    return this.assets[path] as T | undefined
  }

  async load(asset: Asset, dirPath: string, fileName: string) {
    asset.fileName = fileName
    asset.dirPath = dirPath
    this.assets[asset.path] = asset

    await asset.load()

    return asset
  }
}
