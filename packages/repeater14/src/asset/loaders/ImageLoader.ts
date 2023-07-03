import { AssetLoader } from '../AssetLoader'
import { assetLoaderFor } from '../assetLoaderFor'

declare module '../types' {
  interface AssetTypes {
    image: HTMLImageElement
  }

  interface AssetTypeOptions {
    image: {
      src: string
    }
  }
}

@assetLoaderFor('image')
export class ImageLoader extends AssetLoader<'image'> {
  async load(asset: { src: string }) {
    const image = new Image()

    return new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = asset.src
    })
  }
}
