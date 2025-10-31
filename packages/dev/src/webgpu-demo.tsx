import {
  engine,
  Node,
  Camera,
  WebGPUPlugin,
  WebGPUSprite,
  ShaderLibrary,
  FixedUpdateEvent,
  RepeaterEngine,
} from 'repeater14'

console.log('WebGPU Demo Starting...')

// Create custom engine with WebGPU plugin
const webgpuEngine = new RepeaterEngine({
  plugins: [WebGPUPlugin],
})

// Animated sprite that changes color over time
class AnimatedSprite extends WebGPUSprite {
  @Node.on('fixedUpdate')
  fixedUpdate(e: FixedUpdateEvent) {
    const time = e.time / 1000
    const r = Math.sin(time) * 0.5 + 0.5
    const g = Math.cos(time) * 0.5 + 0.5
    const b = Math.sin(time * 2) * 0.5 + 0.5
    this.setShaderUniform('color', [r, g, b, 1.0])
  }
}

@Node.template(() => {
  const colorShader = ShaderLibrary.get('color')!

  return (
    <>
      <Camera
        mode="orthographic"
        width={16}
        height={12}
        position={[0, 0, 5]}
        main
      />

      {/* Red sprite */}
      <WebGPUSprite
        position={[-3, 0, 0]}
        width={2}
        height={2}
        material={{
          shader: colorShader,
          uniforms: {
            color: [1.0, 0.0, 0.0, 1.0],
          },
        }}
      />

      {/* Blue sprite */}
      <WebGPUSprite
        position={[0, 0, 0]}
        width={2}
        height={2}
        material={{
          shader: colorShader,
          uniforms: {
            color: [0.0, 0.5, 1.0, 1.0],
          },
        }}
      />

      {/* Green sprite */}
      <WebGPUSprite
        position={[3, 0, 0]}
        width={2}
        height={2}
        material={{
          shader: colorShader,
          uniforms: {
            color: [0.0, 1.0, 0.0, 1.0],
          },
        }}
      />

      {/* Animated sprite (yellow) */}
      <AnimatedSprite
        position={[0, 3, 0]}
        width={1.5}
        height={1.5}
        material={{
          shader: colorShader,
          uniforms: {
            color: [1.0, 1.0, 0.0, 1.0],
          },
        }}
      />
    </>
  )
})
class WebGPUDemoScene extends Node {
  @Node.child(Camera)
  accessor camera!: Camera

  @Node.on('start')
  start() {
    console.log('Scene starting...')
    console.log('WebGPU initialized!')
    console.log('Available shaders:', ShaderLibrary.list())
    console.log('Demo scene created with', this.children.length, 'children')
  }
}

const start = async () => {
  console.log('Starting WebGPU engine...')

  // Start the engine
  webgpuEngine.start()

  // Add demo scene
  webgpuEngine.root.add(new WebGPUDemoScene())

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
