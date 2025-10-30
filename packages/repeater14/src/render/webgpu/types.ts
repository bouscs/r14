export interface ShaderOptions {
  vertex: string
  fragment: string
  uniforms?: Record<string, any>
}

export interface WebGPUMaterialOptions {
  shader?: ShaderOptions
  color?: [number, number, number, number]
  opacity?: number
  texture?: GPUTexture
  uniforms?: Record<string, any>
}

export interface WebGPURenderObject {
  pipeline: GPURenderPipeline
  bindGroup: GPUBindGroup
  vertexBuffer: GPUBuffer
  uniformBuffer?: GPUBuffer
  uniforms?: Record<string, any>
}

export interface ShaderModule {
  vertex: GPUShaderModule
  fragment: GPUShaderModule
}
