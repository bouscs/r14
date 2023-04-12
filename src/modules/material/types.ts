export interface TextureOptions {
  imageAsset: string
  pixelsPerUnit?: number
}

export interface MaterialOptions {
  color?: number
  opacity?: number
  transparency?: boolean
  texture?: TextureOptions
}
