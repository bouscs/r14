import { WebGPURenderer } from './WebGPURenderer'
import { WebGPUMaterialOptions, ShaderOptions, WebGPURenderObject } from './types'
import { ShaderLibrary } from './ShaderLibrary'

export class WebGPUMaterial {
  renderer: WebGPURenderer
  options: WebGPUMaterialOptions
  shader: ShaderOptions

  pipeline!: GPURenderPipeline
  bindGroup!: GPUBindGroup
  uniformBuffer?: GPUBuffer

  constructor(renderer: WebGPURenderer, options: WebGPUMaterialOptions = {}) {
    this.renderer = renderer
    this.options = options

    // Use provided shader or default shader
    if (options.shader) {
      this.shader = options.shader
    } else {
      this.shader = ShaderLibrary.get('default')!
    }

    this.createPipeline()
  }

  private createPipeline() {
    const vertexShaderModule = this.renderer.createShaderModule(this.shader.vertex)
    const fragmentShaderModule = this.renderer.createShaderModule(this.shader.fragment)

    // Create bind group layout
    const bindGroupLayout = this.renderer.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    })

    const pipelineLayout = this.renderer.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    })

    this.pipeline = this.renderer.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 16, // 4 floats: position (2) + uv (2)
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x2',
              },
              {
                shaderLocation: 1,
                offset: 8,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.renderer.format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    })

    // Create uniform buffer for vertex shader (transform matrices)
    const uniformBufferSize = 128 // 2 mat4x4 (32 floats * 4 bytes)
    const vertexUniformBuffer = this.renderer.createUniformBuffer(uniformBufferSize)

    // Create uniform buffer for fragment shader if needed
    let fragmentUniformBuffer: GPUBuffer | undefined
    if (this.shader.uniforms || this.options.uniforms) {
      const uniformSize = this.calculateUniformBufferSize()
      fragmentUniformBuffer = this.renderer.createUniformBuffer(uniformSize)
      this.uniformBuffer = fragmentUniformBuffer
    }

    // Create bind group
    const bindGroupEntries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: { buffer: vertexUniformBuffer },
      },
    ]

    if (fragmentUniformBuffer) {
      bindGroupEntries.push({
        binding: 1,
        resource: { buffer: fragmentUniformBuffer },
      })
    }

    this.bindGroup = this.renderer.device.createBindGroup({
      layout: bindGroupLayout,
      entries: bindGroupEntries,
    })
  }

  private calculateUniformBufferSize(): number {
    const uniforms = { ...this.shader.uniforms, ...this.options.uniforms }
    let size = 0

    for (const value of Object.values(uniforms)) {
      if (typeof value === 'number') {
        size += 4 // float32
      } else if (Array.isArray(value)) {
        size += value.length * 4 // array of float32
      }
    }

    // Round up to nearest multiple of 16 (WebGPU alignment requirement)
    return Math.ceil(size / 16) * 16
  }

  updateUniforms(uniforms: Record<string, any>) {
    if (!this.uniformBuffer) return

    const data = new ArrayBuffer(this.calculateUniformBufferSize())
    const view = new DataView(data)
    let offset = 0

    for (const [key, value] of Object.entries(uniforms)) {
      if (typeof value === 'number') {
        view.setFloat32(offset, value, true)
        offset += 4
      } else if (Array.isArray(value)) {
        value.forEach(v => {
          view.setFloat32(offset, v, true)
          offset += 4
        })
      }
    }

    this.renderer.updateUniformBuffer(this.uniformBuffer, data)
  }

  createRenderObject(vertexBuffer: GPUBuffer): WebGPURenderObject {
    return {
      pipeline: this.pipeline,
      bindGroup: this.bindGroup,
      vertexBuffer,
      uniformBuffer: this.uniformBuffer,
      uniforms: { ...this.shader.uniforms, ...this.options.uniforms },
    }
  }
}
