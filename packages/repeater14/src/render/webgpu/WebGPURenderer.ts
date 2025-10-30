import { EventEmitter, bound } from 'bouscs-util'
import { engine } from '../..'
import { Camera } from '../../camera'
import { WebGPURenderObject } from './types'

export interface WebGPURendererEvents {
  addCamera: (camera: Camera) => void
  removeCamera: (camera: Camera) => void
}

export class WebGPURenderer extends EventEmitter<WebGPURendererEvents> {
  device!: GPUDevice
  context!: GPUCanvasContext
  canvas: HTMLCanvasElement
  format: GPUTextureFormat = 'bgra8unorm'

  cameras: Camera[] = []
  mainCamera!: Camera

  renderObjects: Map<string, WebGPURenderObject> = new Map()

  initialized = false

  constructor() {
    super()
    this.canvas = document.createElement('canvas')
    this.canvas.width = 800
    this.canvas.height = 600
    document.body.appendChild(this.canvas)
  }

  async initialize() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported on this browser.')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('No appropriate GPUAdapter found.')
    }

    this.device = await adapter.requestDevice()

    const context = this.canvas.getContext('webgpu')
    if (!context) {
      throw new Error('Could not get WebGPU context from canvas.')
    }

    this.context = context
    this.format = navigator.gpu.getPreferredCanvasFormat()

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    })

    this.initialized = true
    engine.clock.on('update', this.render)
  }

  @bound
  render() {
    if (!this.initialized || !this.mainCamera) return

    const commandEncoder = this.device.createCommandEncoder()
    const textureView = this.context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)

    // Render all registered objects
    for (const [id, renderObject] of this.renderObjects) {
      passEncoder.setPipeline(renderObject.pipeline)
      passEncoder.setBindGroup(0, renderObject.bindGroup)
      passEncoder.setVertexBuffer(0, renderObject.vertexBuffer)
      passEncoder.draw(6) // 2 triangles for a quad
    }

    passEncoder.end()
    this.device.queue.submit([commandEncoder.finish()])
  }

  createShaderModule(code: string): GPUShaderModule {
    return this.device.createShaderModule({ code })
  }

  createVertexBuffer(vertices: Float32Array): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    })
    new Float32Array(buffer.getMappedRange()).set(vertices)
    buffer.unmap()
    return buffer
  }

  createUniformBuffer(size: number): GPUBuffer {
    return this.device.createBuffer({
      size,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
  }

  updateUniformBuffer(buffer: GPUBuffer, data: ArrayBuffer) {
    this.device.queue.writeBuffer(buffer, 0, data)
  }

  registerRenderObject(id: string, renderObject: WebGPURenderObject) {
    this.renderObjects.set(id, renderObject)
  }

  unregisterRenderObject(id: string) {
    this.renderObjects.delete(id)
  }

  setSize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
  }
}
