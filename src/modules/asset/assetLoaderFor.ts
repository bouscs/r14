import { engine } from '../engine'
import { AssetLoader } from './AssetLoader'
import { assetLoaders } from './AssetManager'
import { AssetType } from './types'

export const assetLoaderFor =
  <T extends AssetType>(type: T) =>
  (constructor: new () => AssetLoader<T>, context: ClassDecoratorContext) => {
    context.addInitializer(() => {
      assetLoaders[type] = new constructor()
    })
  }
