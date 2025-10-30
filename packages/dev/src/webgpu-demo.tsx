import {
  engine,
  Node,
  NodeProps,
  Camera,
  WebGPUPlugin,
  WebGPUSprite,
  ShaderLibrary,
} from 'repeater14'
import { RepeaterEngine } from 'repeater14/src/engine/RepeaterEngine'

console.log('WebGPU Demo Starting...')

// Create custom engine with WebGPU plugin
const webgpuEngine = new RepeaterEngine({
  plugins: [WebGPUPlugin],
})

class WebGPUDemoScene extends Node {
  @Node.child(Camera)
  accessor camera!: Camera

  @Node.on('start')
  async start() {
    console.log('Scene starting...')

    // Wait for WebGPU to initialize
    if (!webgpuEngine.webgpu) {
      console.error('WebGPU not initialized!')
      return
    }

    console.log('WebGPU initialized!')
    console.log('Available shaders:', ShaderLibrary.list())

    // Create sprites with different shaders

    // 1. Color shader sprite (red square)
    const colorSprite = new WebGPUSprite(webgpuEngine.webgpu, {
      position: [-3, 0, 0],
      width: 2,
      height: 2,
      material: {
        shader: ShaderLibrary.get('color'),
        uniforms: {
          color: [1.0, 0.0, 0.0, 1.0], // Red
        },
      },
    })
    this.add(colorSprite)

    // 2. Another color shader sprite (blue square)
    const blueSprite = new WebGPUSprite(webgpuEngine.webgpu, {
      position: [0, 0, 0],
      width: 2,
      height: 2,
      material: {
        shader: ShaderLibrary.get('color'),
        uniforms: {
          color: [0.0, 0.5, 1.0, 1.0], // Blue
        },
      },
    })
    this.add(blueSprite)

    // 3. Green sprite
    const greenSprite = new WebGPUSprite(webgpuEngine.webgpu, {
      position: [3, 0, 0],
      width: 2,
      height: 2,
      material: {
        shader: ShaderLibrary.get('color'),
        uniforms: {
          color: [0.0, 1.0, 0.0, 1.0], // Green
        },
      },
    })
    this.add(greenSprite)

    // 4. Animated sprite (changing color over time)
    const animatedSprite = new WebGPUSprite(webgpuEngine.webgpu, {
      position: [0, 3, 0],
      width: 1.5,
      height: 1.5,
      material: {
        shader: ShaderLibrary.get('color'),
        uniforms: {
          color: [1.0, 1.0, 0.0, 1.0], // Yellow
        },
      },
    })
    this.add(animatedSprite)

    // Animate the yellow sprite's color
    webgpuEngine.clock.on('update', () => {
      const time = webgpuEngine.clock.time / 1000
      const r = Math.sin(time) * 0.5 + 0.5
      const g = Math.cos(time) * 0.5 + 0.5
      const b = Math.sin(time * 2) * 0.5 + 0.5
      animatedSprite.setShaderUniform('color', [r, g, b, 1.0])
    })

    console.log('Demo scene created with', this.children.length, 'sprites')
  }
}

const start = async () => {
  console.log('Starting WebGPU engine...')

  // Start the engine
  webgpuEngine.start()

  // Create camera
  const camera = new Camera({
    mode: 'orthographic',
    width: 16,
    height: 12,
    position: [0, 0, 5],
    main: true,
  })

  // Set the main camera for the renderer
  if (webgpuEngine.webgpu) {
    webgpuEngine.webgpu.mainCamera = camera
  }

  // Add demo scene
  const scene = new WebGPUDemoScene()
  webgpuEngine.root.add(scene)
  webgpuEngine.root.add(camera)

  console.log('WebGPU Demo ready!')
}

start().catch(error => {
  console.error('Failed to start WebGPU demo:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>WebGPU Demo Error</h1>
      <p>Failed to initialize WebGPU. This could be because:</p>
      <ul>
        <li>Your browser doesn't support WebGPU</li>
        <li>WebGPU is not enabled in your browser settings</li>
      </ul>
      <p>Error: ${error.message}</p>
      <p>Try using Chrome or Edge with WebGPU enabled.</p>
    </div>
  `
})
