import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import './TextPressure.css'

type SharedPointer = {
  x: number
  y: number
  active?: boolean
  pointerType?: string
}

type TextPressureProps = {
  sharedCursor?: RefObject<SharedPointer>
  text: string
  flex?: boolean
  alpha?: boolean
  stroke?: boolean
  width?: boolean
  weight?: boolean
  italic?: boolean
  textColor?: string
  strokeColor?: string
  minFontSize?: number
  widthStrength?: number
  weightStrength?: number
}

type PressureMetrics = {
  centers: Array<{ x: number; y: number }>
  maxDistance: number
  strengthScale: number
}

const BASE_WIDTH = 100
const MAX_WIDTH = 151
const BASE_WEIGHT = 600
const MAX_WEIGHT = 1000

const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

// React Bits' original distance-to-axis mapping.
const getAttribute = (distance: number, maxDistance: number, minimum: number, range: number) => {
  const value = range - Math.abs((range * distance) / Math.max(1, maxDistance))
  return Math.max(minimum, value + minimum)
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export function TextPressure({
  sharedCursor,
  text,
  flex = true,
  alpha = false,
  stroke = false,
  width = true,
  weight = true,
  italic = true,
  textColor = 'rgba(255, 255, 255, 0.82)',
  strokeColor = '#bcecff',
  minFontSize = 36,
}: TextPressureProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([])
  const metricsRef = useRef<PressureMetrics>({ centers: [], maxDistance: 260, strengthScale: 1 })
  const targetPointerRef = useRef({ x: -1000, y: -1000 })
  const smoothPointerRef = useRef({ x: -1000, y: -1000 })
  const localPointerRef = useRef({ active: false, pointerType: '' })

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const finePointer = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    let measureFrame = 0
    let settleFrame = 0
    let animationFrame = 0

    const resetLetters = () => {
      letterRefs.current.forEach((letter) => {
        if (!letter) return
        letter.style.fontVariationSettings = `'wght' ${BASE_WEIGHT}, 'wdth' ${BASE_WIDTH}, 'slnt' 0`
        letter.style.opacity = '1'
      })
    }

    const cacheMetrics = () => {
      const rect = root.getBoundingClientRect()
      metricsRef.current = {
        centers: letterRefs.current.map((letter) => {
          if (!letter) return { x: -1000, y: -1000 }
          const letterRect = letter.getBoundingClientRect()
          return { x: letterRect.left + letterRect.width / 2, y: letterRect.top + letterRect.height / 2 }
        }),
        maxDistance: Math.max(1, rect.width / 2),
        strengthScale: rect.width < 560 ? 0.76 : rect.width < 900 ? 0.88 : 1,
      }
    }

    const measure = () => {
      const rect = root.getBoundingClientRect()
      resetLetters()
      root.style.setProperty('--text-pressure-size', '100px')

      cancelAnimationFrame(settleFrame)
      settleFrame = requestAnimationFrame(() => {
        const baseWidth = letterRefs.current.reduce((total, letter) => total + (letter?.getBoundingClientRect().width ?? 0), 0)
        const widthLimitedSize = baseWidth > 0 ? (rect.width * 0.8 * 100) / baseWidth : minFontSize
        const fontSize = Math.max(minFontSize, Math.min(widthLimitedSize, rect.height * 0.72))
        root.style.setProperty('--text-pressure-size', `${fontSize}px`)
        settleFrame = requestAnimationFrame(cacheMetrics)
      })
    }

    const scheduleMeasure = () => {
      cancelAnimationFrame(measureFrame)
      measureFrame = requestAnimationFrame(measure)
    }

    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(root)
    scheduleMeasure()
    document.fonts?.ready.then(scheduleMeasure).catch(() => undefined)

    const animate = () => {
      animationFrame = requestAnimationFrame(animate)

      const shared = sharedCursor?.current
      if (shared) {
        targetPointerRef.current.x = shared.x
        targetPointerRef.current.y = shared.y
      }

      // Same smoothing model as the original React Bits component.
      smoothPointerRef.current.x += (targetPointerRef.current.x - smoothPointerRef.current.x) / 15
      smoothPointerRef.current.y += (targetPointerRef.current.y - smoothPointerRef.current.y) / 15

      const pointerActive = shared ? Boolean(shared.active) : localPointerRef.current.active
      const pointerType = shared?.pointerType ?? localPointerRef.current.pointerType
      const pressureEnabled = pointerActive && (finePointer.matches || pointerType === 'touch' || pointerType === 'pen')
      const metrics = metricsRef.current

      letterRefs.current.forEach((letter, index) => {
        const center = metrics.centers[index]
        if (!letter || !center) return

        const distance = pressureEnabled ? distanceBetween(smoothPointerRef.current, center) : metrics.maxDistance
        const rawWidth = clamp(getAttribute(distance, metrics.maxDistance, BASE_WIDTH, MAX_WIDTH - BASE_WIDTH), BASE_WIDTH, MAX_WIDTH)
        const rawWeight = clamp(getAttribute(distance, metrics.maxDistance, BASE_WEIGHT, MAX_WEIGHT - BASE_WEIGHT), BASE_WEIGHT, MAX_WEIGHT)
        const wdth = width ? BASE_WIDTH + (rawWidth - BASE_WIDTH) * metrics.strengthScale : BASE_WIDTH
        const wght = weight ? BASE_WEIGHT + (rawWeight - BASE_WEIGHT) * metrics.strengthScale : BASE_WEIGHT
        const ital = italic ? clamp(getAttribute(distance, metrics.maxDistance, 0, 1), 0, 1) : 0
        const opacity = alpha ? clamp(getAttribute(distance, metrics.maxDistance, 0, 1), 0, 1) : 1

        letter.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'slnt' ${-ital * 7}`
        letter.style.opacity = `${opacity}`
      })
    }

    animationFrame = requestAnimationFrame(animate)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(measureFrame)
      cancelAnimationFrame(settleFrame)
      cancelAnimationFrame(animationFrame)
    }
  }, [alpha, italic, minFontSize, sharedCursor, text, weight, width])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (sharedCursor) return
    targetPointerRef.current = { x: event.clientX, y: event.clientY }
    localPointerRef.current = { active: true, pointerType: event.pointerType }
  }
  const resetLocalPointer = () => {
    if (sharedCursor) return
    targetPointerRef.current = { x: -1000, y: -1000 }
    localPointerRef.current = { active: false, pointerType: '' }
  }

  return <div
    ref={rootRef}
    className="text-pressure"
    aria-label={text}
    onPointerMove={handlePointerMove}
    onPointerLeave={resetLocalPointer}
    onPointerUp={resetLocalPointer}
    onPointerCancel={resetLocalPointer}
    style={{
      '--text-pressure-color': textColor,
      '--text-pressure-stroke': stroke ? `1px ${strokeColor}` : '0 transparent',
    } as CSSProperties}
  >
    <span className={`text-pressure__row${flex ? ' text-pressure__row--flex' : ''}`} aria-hidden="true">
      {[...text].map((letter, index) => <span
        className="text-pressure__letter"
        key={`${letter}-${index}`}
        ref={(node) => { letterRefs.current[index] = node }}
      >{letter}</span>)}
    </span>
  </div>
}
