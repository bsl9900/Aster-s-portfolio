import { useEffect, useRef } from 'react'
import { Geometry, Mesh, Program, Renderer, RenderTarget, Texture, Triangle } from 'ogl'
import './RippleDistortion.css'

type RippleQuality = 'low' | 'medium' | 'high'
type RippleTrigger = 'hover' | 'click' | 'both'

type RippleDistortionProps = {
  src: string
  brushSize?: number
  strength?: number
  swirl?: number
  rings?: number
  grayscale?: boolean
  spread?: number
  fade?: number
  spacing?: number
  dispersion?: number
  glint?: number
  tint?: string
  tintAmount?: number
  highlightColor?: string
  trigger?: RippleTrigger
  clickStrength?: number
  quality?: RippleQuality
  enabled?: boolean
  overlay?: boolean
  coverPosition?: [number, number]
  className?: string
  onReady?: () => void
  onError?: () => void
}

const MAX_WAVES = 100
const QUALITY_SCALE: Record<RippleQuality, number> = { low: 0.4, medium: 0.7, high: 1 }
const START_SCALE = 1.5
const LIFE_CONSTANT = Math.log(500)
const DEFAULT_COVER_POSITION: [number, number] = [0.5, 0.5]

const waveVertex = `
precision highp float;
attribute vec2 position; attribute vec2 uv; attribute vec2 iOffset; attribute vec2 iScale; attribute float iOpacity;
varying vec2 vUv; varying float vOpacity;
void main() { vUv = uv; vOpacity = iOpacity; gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0); }
`

const waveFragment = `
precision highp float;
varying vec2 vUv; varying float vOpacity; uniform float uRings;
const float PI = 3.141592653589793; const float EDGE = 0.006737947;
void main() {
  vec2 p = vUv * 2.0 - 1.0; float r = dot(p, p); if (r > 1.0) discard;
  float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);
  brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);
  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}
`

const screenVertex = `
precision highp float;
attribute vec2 position; attribute vec2 uv; varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`

const compositeFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture; uniform sampler2D uDisplacement;
uniform vec2 uResolution; uniform vec2 uTextureSize; uniform vec2 uTexel; uniform vec2 uCoverPosition;
uniform vec3 uTint; uniform vec3 uHighlight;
uniform float uStrength; uniform float uSwirl; uniform float uDispersion; uniform float uGlint; uniform float uTintAmount; uniform float uGrayscale; uniform float uOverlay;
const float TAU = 6.283185307179586;
vec2 coverUV(vec2 uv) {
  vec2 safe = max(uTextureSize, vec2(1.0)); vec2 s = uResolution / safe;
  vec2 scaledSize = safe * max(s.x, s.y); vec2 offset = (uResolution - scaledSize) * uCoverPosition;
  return (uv * uResolution - offset) / scaledSize;
}
void main() {
  float amount = texture2D(uDisplacement, vUv).r; vec2 base = coverUV(vUv);
  float theta = amount * uSwirl * TAU; vec2 dir = vec2(sin(theta), cos(theta)); vec2 push = dir * amount * uStrength;
  vec3 color;
  if (uDispersion > 0.001) {
    float split = uDispersion * 0.25;
    color.r = texture2D(uTexture, base + push * (1.0 + split)).r;
    color.g = texture2D(uTexture, base + push).g;
    color.b = texture2D(uTexture, base + push * (1.0 - split)).b;
  } else { color = texture2D(uTexture, base + push).rgb; }
  if (uGrayscale > 0.001) color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGrayscale);
  if (uTintAmount > 0.001) color = mix(color, color * uTint * 1.9, clamp(amount * 1.6, 0.0, 1.0) * uTintAmount);
  if (uGlint > 0.001) {
    float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
    float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
    vec3 normal = normalize(vec3(-ex * 26.0, -ey * 26.0, 1.0)); vec3 light = normalize(vec3(-0.35, 0.55, 1.0));
    float raw = pow(max(dot(normal, light), 0.0), 22.0); float flatSpec = pow(max(light.z, 0.0), 22.0);
    color += uHighlight * clamp((raw - flatSpec) / max(1.0 - flatSpec, 0.0001), 0.0, 1.0) * uGlint;
  }
  float alpha = uOverlay > 0.5 ? clamp(amount * 1.25, 0.0, 0.72) : 1.0;
  gl_FragColor = vec4(color, alpha);
}
`

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((part) => part + part).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return [1, 1, 1]
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

/** React Bits RippleDistortion with a transparent, static-image-safe initialization path. */
export function RippleDistortion({
  src,
  brushSize = 150,
  strength = 0.2,
  swirl = 1,
  rings = 4,
  grayscale = true,
  spread = 5,
  fade = 3,
  spacing = 15,
  dispersion = 0,
  glint = 0,
  tint = '#a855f7',
  tintAmount = 0.1,
  highlightColor = '#ffffff',
  trigger = 'hover',
  clickStrength = 2,
  quality = 'low',
  enabled = true,
  overlay = false,
  coverPosition = DEFAULT_COVER_POSITION,
  className = '',
  onReady,
  onError,
}: RippleDistortionProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const configRef = useRef({ brushSize, spread, fade, spacing, clickStrength, trigger, enabled })
  const uniformsRef = useRef<any>(null)

  configRef.current = { brushSize, spread, fade, spacing, clickStrength, trigger, enabled }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !enabled) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let renderer: Renderer
    // OGL augments its WebGL context with renderer/canvas metadata at runtime.
    let gl: any
    let canvas: HTMLCanvasElement
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        dpr,
      })
      gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)
      canvas = gl.canvas as HTMLCanvasElement
      canvas.style.cssText = 'width:100%;height:100%;display:block;opacity:0;transition:opacity 160ms ease;'
      // A renderer is always scoped to this mount. Remove a stale canvas first
      // as a defensive guard for mobile resize/orientation edge cases.
      mount.querySelectorAll('canvas').forEach((staleCanvas) => staleCanvas.remove())
      mount.appendChild(canvas)
    } catch {
      onError?.()
      return
    }

    const imageTexture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE })
    let disposed = false
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'

    const offsets = new Float32Array(MAX_WAVES * 2)
    const scales = new Float32Array(MAX_WAVES * 2)
    const opacities = new Float32Array(MAX_WAVES)
    const waves = Array.from({ length: MAX_WAVES }, () => ({ x: 0, y: 0, scale: START_SCALE, target: START_SCALE, size: 1, opacity: 0 }))
    let current = 0

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
      uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
      iOffset: { instanced: 1, size: 2, data: offsets },
      iScale: { instanced: 1, size: 2, data: scales },
      iOpacity: { instanced: 1, size: 1, data: opacities },
    })
    const waveUniforms = { uRings: { value: rings } }
    const waveProgram = new Program(gl, { vertex: waveVertex, fragment: waveFragment, uniforms: waveUniforms, transparent: true, depthTest: false, depthWrite: false, cullFace: false })
    waveProgram.setBlendFunc(gl.ONE, gl.ONE)
    const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false })
    const displacementTarget = new RenderTarget(gl, { width: 2, height: 2, depth: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE })
    const compositeUniforms = {
      uTexture: { value: imageTexture }, uDisplacement: { value: displacementTarget.texture }, uResolution: { value: [1, 1] },
      uTextureSize: { value: [1, 1] }, uTexel: { value: [1, 1] }, uCoverPosition: { value: coverPosition },
      uTint: { value: hexToRgb(tint) }, uHighlight: { value: hexToRgb(highlightColor) }, uStrength: { value: strength },
      uSwirl: { value: swirl }, uDispersion: { value: dispersion }, uGlint: { value: glint },
      uTintAmount: { value: tintAmount }, uGrayscale: { value: grayscale ? 1 : 0 }, uOverlay: { value: overlay ? 1 : 0 },
    }
    const compositeMesh = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex: screenVertex, fragment: compositeFragment, uniforms: compositeUniforms, depthTest: false, depthWrite: false }) })
    uniformsRef.current = { wave: waveUniforms, composite: compositeUniforms }

    image.onload = () => {
      if (disposed) return
      imageTexture.image = image
      compositeUniforms.uTextureSize.value = [image.naturalWidth || 1, image.naturalHeight || 1]
      canvas.style.opacity = '1'
      onReady?.()
    }
    image.onerror = () => onError?.()
    image.src = src

    let width = 1
    let height = 1
    const resize = () => {
      width = Math.max(1, mount.clientWidth)
      height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height)
      compositeUniforms.uResolution.value = [width, height]
      const scale = QUALITY_SCALE[quality]
      const fieldWidth = Math.max(2, Math.round(width * scale))
      const fieldHeight = Math.max(2, Math.round(height * scale))
      displacementTarget.setSize(fieldWidth, fieldHeight)
      compositeUniforms.uTexel.value = [1 / fieldWidth, 1 / fieldHeight]
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const createWave = (x: number, y: number, power: number) => {
      const config = configRef.current
      const wave = waves[current]
      current = (current + 1) % MAX_WAVES
      wave.x = x; wave.y = y; wave.scale = START_SCALE * power
      wave.target = START_SCALE * Math.max(1, config.spread) * power
      wave.size = Math.max(1, config.brushSize); wave.opacity = 1
    }
    const localPoint = (clientX: number, clientY: number) => {
      const rect = mount.getBoundingClientRect()
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom || !rect.width || !rect.height) return null
      return [clientX - rect.left, rect.height - (clientY - rect.top)] as const
    }
    let previousX = 0
    let previousY = 0
    const onMove = (event: PointerEvent) => {
      const config = configRef.current
      if (!config.enabled || config.trigger === 'click') return
      const point = localPoint(event.clientX, event.clientY)
      if (!point) return
      if (Math.abs(point[0] - previousX) > Math.max(1, config.spacing) || Math.abs(point[1] - previousY) > Math.max(1, config.spacing)) {
        createWave(point[0], point[1], 1); previousX = point[0]; previousY = point[1]
      }
    }
    const onDown = (event: PointerEvent) => {
      const config = configRef.current
      if (!config.enabled || config.trigger === 'hover') return
      const point = localPoint(event.clientX, event.clientY)
      if (point) createWave(point[0], point[1], Math.max(1, config.clickStrength))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })

    let animationFrame = 0
    let previousTime = 0
    const render = (now: number) => {
      animationFrame = requestAnimationFrame(render)
      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0
      previousTime = now
      const config = configRef.current
      const growth = 1 - Math.exp(-delta * 1.09)
      const decay = Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, config.fade))
      for (let index = 0; index < MAX_WAVES; index += 1) {
        const wave = waves[index]
        if (wave.opacity <= 0) { opacities[index] = 0; continue }
        wave.opacity *= decay; wave.scale += (wave.target - wave.scale) * growth
        if (wave.opacity < 0.002) { wave.opacity = 0; opacities[index] = 0; continue }
        const half = (wave.scale * wave.size) / 2
        offsets[index * 2] = (wave.x / width) * 2 - 1; offsets[index * 2 + 1] = (wave.y / height) * 2 - 1
        scales[index * 2] = (half / width) * 2; scales[index * 2 + 1] = (half / height) * 2; opacities[index] = wave.opacity
      }
      geometry.attributes.iOffset.needsUpdate = true; geometry.attributes.iScale.needsUpdate = true; geometry.attributes.iOpacity.needsUpdate = true
      renderer.render({ scene: waveMesh, target: displacementTarget, clear: true })
      renderer.render({ scene: compositeMesh })
    }
    animationFrame = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      uniformsRef.current = null
      if (canvas.parentNode === mount) mount.removeChild(canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [src, quality, enabled, coverPosition, overlay, onError, onReady])

  useEffect(() => {
    const uniforms = uniformsRef.current
    if (!uniforms) return
    uniforms.wave.uRings.value = rings
    uniforms.composite.uStrength.value = strength; uniforms.composite.uSwirl.value = swirl; uniforms.composite.uDispersion.value = dispersion
    uniforms.composite.uGlint.value = glint; uniforms.composite.uTintAmount.value = tintAmount; uniforms.composite.uGrayscale.value = grayscale ? 1 : 0
    uniforms.composite.uHighlight.value = hexToRgb(highlightColor); uniforms.composite.uTint.value = hexToRgb(tint); uniforms.composite.uCoverPosition.value = coverPosition
  }, [rings, strength, swirl, dispersion, glint, tintAmount, grayscale, highlightColor, tint, coverPosition])

  return <div ref={mountRef} className={`ripple-distortion ${className}`.trim()} aria-hidden="true" />
}
