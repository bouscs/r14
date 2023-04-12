import { AssetType, AssetTypeOptions, AssetTypes } from './types'

export abstract class AssetLoader<T extends AssetType> {
  abstract load(asset: AssetTypeOptions[T]): Promise<AssetTypes[T]>
}
