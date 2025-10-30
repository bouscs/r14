import { RepeaterPlugin } from '../../engine'
import { WebGPURenderer } from './WebGPURenderer'

declare module '../../engine/RepeaterEngine' {
  interface RepeaterEngine {
    webgpu?: WebGPURenderer
  }
}

export class WebGPUPlugin extends RepeaterPlugin {
  async load() {
    const renderer = new WebGPURenderer()
    await renderer.initialize()
    this.engine.webgpu = renderer
  }
}
