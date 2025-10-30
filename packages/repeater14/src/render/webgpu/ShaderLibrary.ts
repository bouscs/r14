import { ShaderOptions } from './types'

/**
 * Default vertex shader for 2D sprites
 */
export const DEFAULT_VERTEX_SHADER = `
struct VertexInput {
  @location(0) position: vec2<f32>,
  @location(1) uv: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

struct Uniforms {
  transform: mat4x4<f32>,
  projection: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.projection * uniforms.transform * vec4<f32>(input.position, 0.0, 1.0);
  output.uv = input.uv;
  return output;
}
`

/**
 * Default fragment shader with texture support
 */
export const DEFAULT_FRAGMENT_SHADER = `
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var textureData: texture_2d<f32>;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(textureData, textureSampler, uv);
}
`

/**
 * Simple color fragment shader
 */
export const COLOR_FRAGMENT_SHADER = `
struct FragmentUniforms {
  color: vec4<f32>,
}

@group(0) @binding(1) var<uniform> fragmentUniforms: FragmentUniforms;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return fragmentUniforms.color;
}
`

/**
 * Wavy shader effect
 */
export const WAVY_FRAGMENT_SHADER = `
struct FragmentUniforms {
  time: f32,
  amplitude: f32,
  frequency: f32,
}

@group(0) @binding(1) var<uniform> fragmentUniforms: FragmentUniforms;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var textureData: texture_2d<f32>;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let offset = sin(uv.y * fragmentUniforms.frequency + fragmentUniforms.time) * fragmentUniforms.amplitude;
  let distortedUV = vec2<f32>(uv.x + offset, uv.y);
  return textureSample(textureData, textureSampler, distortedUV);
}
`

/**
 * Pixelate shader effect
 */
export const PIXELATE_FRAGMENT_SHADER = `
struct FragmentUniforms {
  pixelSize: f32,
}

@group(0) @binding(1) var<uniform> fragmentUniforms: FragmentUniforms;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var textureData: texture_2d<f32>;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let pixelSize = fragmentUniforms.pixelSize;
  let pixelatedUV = floor(uv / pixelSize) * pixelSize;
  return textureSample(textureData, textureSampler, pixelatedUV);
}
`

/**
 * Glow shader effect
 */
export const GLOW_FRAGMENT_SHADER = `
struct FragmentUniforms {
  glowColor: vec4<f32>,
  glowIntensity: f32,
}

@group(0) @binding(1) var<uniform> fragmentUniforms: FragmentUniforms;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var textureData: texture_2d<f32>;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let texColor = textureSample(textureData, textureSampler, uv);
  let glow = fragmentUniforms.glowColor * fragmentUniforms.glowIntensity;
  return texColor + glow * texColor.a;
}
`

/**
 * Shader library with predefined shaders
 */
export class ShaderLibrary {
  private static shaders: Map<string, ShaderOptions> = new Map()

  static {
    // Register default shaders
    this.register('default', {
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: DEFAULT_FRAGMENT_SHADER,
    })

    this.register('color', {
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: COLOR_FRAGMENT_SHADER,
    })

    this.register('wavy', {
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: WAVY_FRAGMENT_SHADER,
      uniforms: {
        time: 0,
        amplitude: 0.05,
        frequency: 10.0,
      },
    })

    this.register('pixelate', {
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: PIXELATE_FRAGMENT_SHADER,
      uniforms: {
        pixelSize: 0.01,
      },
    })

    this.register('glow', {
      vertex: DEFAULT_VERTEX_SHADER,
      fragment: GLOW_FRAGMENT_SHADER,
      uniforms: {
        glowColor: [1.0, 1.0, 1.0, 1.0],
        glowIntensity: 0.5,
      },
    })
  }

  static register(name: string, shader: ShaderOptions) {
    this.shaders.set(name, shader)
  }

  static get(name: string): ShaderOptions | undefined {
    return this.shaders.get(name)
  }

  static has(name: string): boolean {
    return this.shaders.has(name)
  }

  static list(): string[] {
    return Array.from(this.shaders.keys())
  }
}
