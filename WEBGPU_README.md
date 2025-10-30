# WebGPU Rendering System

This branch adds a powerful WebGPU rendering system to repeater14, enabling custom shaders and high-performance GPU rendering.

## Features

### 🎨 WebGPU Renderer
- Modern GPU-accelerated rendering using WebGPU API
- Coexists with the existing Three.js renderer
- Automatic canvas creation and context management
- Efficient render pipeline with batch rendering support

### ✨ Shader System
- Write custom shaders in WGSL (WebGPU Shading Language)
- Built-in shader library with common effects:
  - `default` - Basic texture rendering
  - `color` - Solid color rendering
  - `wavy` - Wave distortion effect
  - `pixelate` - Pixelation effect
  - `glow` - Glow effect
- Easy shader registration and reuse
- Dynamic uniform updates

### 🎭 WebGPU Materials
- Material system supporting custom shaders
- Automatic uniform buffer management
- Support for custom uniforms
- Blend mode support for transparency

### 🖼️ WebGPU Sprites
- Sprite rendering with WebGPU
- Position, rotation, scale transforms
- Custom shader support per sprite
- Real-time uniform updates via `setShaderUniform()`

## Usage

### Basic Setup

```typescript
import {
  RepeaterEngine,
  WebGPUPlugin,
  WebGPUSprite,
  ShaderLibrary,
} from 'repeater14'

// Create engine with WebGPU plugin
const engine = new RepeaterEngine({
  plugins: [WebGPUPlugin],
})

// Start the engine
await engine.start()
```

### Creating Sprites with Shaders

```typescript
// Simple color sprite
const sprite = new WebGPUSprite(engine.webgpu, {
  position: [0, 0, 0],
  width: 2,
  height: 2,
  material: {
    shader: ShaderLibrary.get('color'),
    uniforms: {
      color: [1.0, 0.0, 0.0, 1.0], // RGBA red
    },
  },
})

// Add to scene
engine.root.add(sprite)
```

### Custom Shaders

```typescript
// Define custom shader
const customShader = {
  vertex: `
    // ... vertex shader code in WGSL
  `,
  fragment: `
    @fragment
    fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
      // Your custom shader logic
      return vec4<f32>(uv.x, uv.y, 0.5, 1.0);
    }
  `,
  uniforms: {
    customValue: 0.5,
  },
}

// Register in shader library
ShaderLibrary.register('myCustomShader', customShader)

// Use it
const sprite = new WebGPUSprite(engine.webgpu, {
  material: {
    shader: ShaderLibrary.get('myCustomShader'),
  },
})
```

### Animating Uniforms

```typescript
// Update shader uniforms in real-time
engine.clock.on('update', () => {
  const time = engine.clock.time / 1000
  sprite.setShaderUniform('time', time)
  sprite.setShaderUniform('color', [
    Math.sin(time) * 0.5 + 0.5,
    Math.cos(time) * 0.5 + 0.5,
    0.5,
    1.0,
  ])
})
```

## Running the Demo

```bash
npm run dev
```

Then open `webgpu-demo.html` to see the WebGPU shaders in action!

## Browser Support

WebGPU requires:
- Chrome 113+ or Edge 113+
- Firefox Nightly (with `dom.webgpu.enabled` flag)
- Safari Technology Preview

## Architecture

### File Structure

```
packages/repeater14/src/render/webgpu/
├── types.ts              # TypeScript types and interfaces
├── WebGPURenderer.ts     # Main renderer class
├── WebGPUMaterial.ts     # Material system
├── WebGPUSprite.ts       # Sprite rendering
├── WebGPUPlugin.ts       # Engine plugin
├── ShaderLibrary.ts      # Built-in shaders
└── index.ts              # Exports
```

### Key Classes

- **WebGPURenderer**: Manages device, context, and render loop
- **WebGPUMaterial**: Handles shader pipelines and bind groups
- **WebGPUSprite**: Sprite node with WebGPU rendering
- **ShaderLibrary**: Centralized shader management

## WGSL Shader Format

Shaders use WGSL (WebGPU Shading Language):

```wgsl
// Vertex Shader
@vertex
fn main(
  @location(0) position: vec2<f32>,
  @location(1) uv: vec2<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.uv = uv;
  return output;
}

// Fragment Shader
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(uv.x, uv.y, 0.5, 1.0);
}
```

## Future Enhancements

- [ ] Texture loading and sampling
- [ ] Post-processing effects
- [ ] Compute shader support
- [ ] Multiple render targets
- [ ] Shadow mapping
- [ ] Particle systems with compute shaders
- [ ] 3D model rendering with WebGPU

## Contributing

Feel free to add more shaders to the `ShaderLibrary` or create new rendering features!
