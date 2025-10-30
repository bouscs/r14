import { Node, NodeProps } from '../../node'
import { WebGPURenderer } from './WebGPURenderer'
import { WebGPUMaterial } from './WebGPUMaterial'
import { WebGPUMaterialOptions } from './types'
import { v4 as uuidv4 } from 'uuid'

export interface WebGPUSpriteProps {
  material?: WebGPUMaterialOptions
  width?: number
  height?: number
}

export class WebGPUSprite extends Node {
  renderer: WebGPURenderer
  material: WebGPUMaterial
  vertexBuffer: GPUBuffer
  id: string

  width: number
  height: number

  constructor(renderer: WebGPURenderer, props: WebGPUSpriteProps & NodeProps) {
    super(props)

    this.renderer = renderer
    this.id = uuidv4()
    this.width = props.width ?? 1
    this.height = props.height ?? 1

    // Create material
    this.material = new WebGPUMaterial(renderer, props.material)

    // Create quad vertices (position + UV)
    const halfWidth = this.width / 2
    const halfHeight = this.height / 2

    const vertices = new Float32Array([
      // Triangle 1
      -halfWidth, -halfHeight, 0.0, 1.0, // bottom-left
      halfWidth, -halfHeight, 1.0, 1.0,  // bottom-right
      halfWidth, halfHeight, 1.0, 0.0,   // top-right

      // Triangle 2
      -halfWidth, -halfHeight, 0.0, 1.0, // bottom-left
      halfWidth, halfHeight, 1.0, 0.0,   // top-right
      -halfWidth, halfHeight, 0.0, 0.0,  // top-left
    ])

    this.vertexBuffer = renderer.createVertexBuffer(vertices)

    // Register with renderer
    const renderObject = this.material.createRenderObject(this.vertexBuffer)
    this.renderer.registerRenderObject(this.id, renderObject)
  }

  @Node.on('update')
  update() {
    // Update transform uniforms based on position, rotation, scale
    this.updateTransform()

    // Update custom shader uniforms if they exist
    if (this.material.uniformBuffer) {
      const renderObject = this.renderer.renderObjects.get(this.id)
      if (renderObject?.uniforms) {
        this.material.updateUniforms(renderObject.uniforms)
      }
    }
  }

  private updateTransform() {
    // Create transform matrix from position, rotation, scale
    const transform = new Float32Array(16)

    // For now, simple 2D transform (you can expand this to use full 3D transforms)
    transform[0] = this.scale.x
    transform[5] = this.scale.y
    transform[10] = this.scale.z
    transform[12] = this.position.x
    transform[13] = this.position.y
    transform[14] = this.position.z
    transform[15] = 1.0

    // Create orthographic projection matrix
    const projection = this.createOrthographicProjection()

    // Combine into uniform buffer
    const uniformData = new Float32Array(32)
    uniformData.set(transform, 0)
    uniformData.set(projection, 16)

    // Update the uniform buffer
    const renderObject = this.renderer.renderObjects.get(this.id)
    if (renderObject) {
      this.renderer.updateUniformBuffer(
        renderObject.bindGroup.getBindGroupLayout(0) as any, // Type workaround
        uniformData.buffer
      )
    }
  }

  private createOrthographicProjection(): Float32Array {
    const width = this.renderer.canvas.width
    const height = this.renderer.canvas.height
    const near = 0.1
    const far = 100

    const projection = new Float32Array(16)
    projection[0] = 2 / width
    projection[5] = 2 / height
    projection[10] = -2 / (far - near)
    projection[14] = -(far + near) / (far - near)
    projection[15] = 1.0

    return projection
  }

  setShaderUniform(name: string, value: any) {
    const renderObject = this.renderer.renderObjects.get(this.id)
    if (renderObject && renderObject.uniforms) {
      renderObject.uniforms[name] = value
    }
  }

  destroy() {
    this.renderer.unregisterRenderObject(this.id)
    super.destroy()
  }
}
