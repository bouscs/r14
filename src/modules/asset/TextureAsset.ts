import { Signal } from 'aureamorum'
import { Asset } from './Asset'
import * as THREE from 'three'

export interface TextureAssetOptions {
  url: string
  pixelsPerUnit?: number
}

export class TextureAsset extends Asset {
  threeTexture: THREE.Texture

  options: TextureAssetOptions

  width: number
  height: number

  pixelsPerUnit: number

  constructor(options: TextureAssetOptions) {
    super()
    this.options = options
    this.width = 0
    this.height = 0
    this.pixelsPerUnit = options.pixelsPerUnit || 100
    this.threeTexture = new THREE.Texture()
  }

  async load() {
    const load = new Signal()
    const img = new Image()
    img.src = this.options.url
    img.onload = () => {
      this.threeTexture.image = img
      this.threeTexture.needsUpdate = true
      load.call()
    }

    await load

    this.width = img.width
    this.height = img.height
  }
}
