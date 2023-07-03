import { Asset } from './Asset'
import { AssetLoader } from './AssetLoader'
import { AssetType, AssetTypes } from './types'

export const assetLoaders: {
  [Key in AssetType]: AssetLoader<Key>
} = {} as any

export class AssetManager {
  private assets: Record<string, AssetTypes[AssetType]> = {}

  get loaders() {
    return assetLoaders
  }

  get<T extends AssetType>(path: string) {
    return this.assets[path] as AssetTypes[T] | undefined
  }

  async load(options: {
    [Key in AssetType]: {
      [assetPath: string]: Parameters<AssetLoader<Key>['load']>[0]
    }
  }) {
    for (const _type in options) {
      const type: AssetType = _type as any
      const loader = this.loaders[type]

      if (!loader) {
        throw new Error(`No loader for type ${type}`)
      }

      const assets = options[type]

      for (const path in assets) {
        const existingAsset = this.get(path)

        if (existingAsset) {
          continue
        }

        const asset = await loader.load(assets[path])

        this.assets[path] = asset
      }
    }
  }
}
