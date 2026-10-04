import { useEffect, useRef, type CSSProperties, type MutableRefObject } from 'react'
import pixelCorners from '../../assets/ambient-background/pixel-corners.png'
import aster from '../../assets/ambient-background/aster.png'
import portfolio from '../../assets/ambient-background/portfolio.png'
import starOne from '../../assets/ambient-background/star-one.png'
import starTwo from '../../assets/ambient-background/star-two.png'
import year2005 from '../../assets/ambient-background/year-2005.png'
import './AmbientBackground.css'

export type AmbientBackgroundVariant = 'about' | 'projects' | 'experience' | 'contact' | 'project-list'

type AmbientSymbol = {
  key: string
  src: string
  alt: string
  left: string
  top: string
  width: string
  duration: number
  delay: number
  opacity: number
  driftX: number
  driftY: number
  rotate: number
  mobileHidden?: boolean
}

const sharedSymbols = [
  { key: 'aster', src: aster, alt: 'Aster*', width: 'clamp(7.5rem, 17vw, 20rem)', duration: 9.5, delay: -4, opacity: 0.16, driftX: 14, driftY: 18, rotate: 2 },
  { key: 'portfolio', src: portfolio, alt: 'Portfolio*', width: 'clamp(8rem, 18vw, 21rem)', duration: 12, delay: -7, opacity: 0.15, driftX: -12, driftY: 20, rotate: -2.5 },
  { key: 'year', src: year2005, alt: '2005', width: 'clamp(6.5rem, 14vw, 15rem)', duration: 10.5, delay: -5, opacity: 0.14, driftX: 16, driftY: -16, rotate: 1.5 },
  { key: 'star-one', src: starOne, alt: '*', width: 'clamp(2.5rem, 5vw, 5.25rem)', duration: 7.5, delay: -3, opacity: 0.12, driftX: -10, driftY: -14, rotate: 3 },
  { key: 'star-two', src: starTwo, alt: '*', width: 'clamp(2rem, 4vw, 4.5rem)', duration: 8.75, delay: -6, opacity: 0.1, driftX: 12, driftY: 15, rotate: -2, mobileHidden: true },
] as const

const anchors: Record<AmbientBackgroundVariant, Array<[string, string]>> = {
  about: [['2%', '67%'], ['72%', '8%'], ['56%', '78%'], ['27%', '13%'], ['89%', '57%']],
  projects: [['4%', '62%'], ['69%', '11%'], ['76%', '76%'], ['18%', '18%'], ['90%', '48%']],
  experience: [['3%', '72%'], ['70%', '8%'], ['76%', '76%'], ['25%', '13%'], ['92%', '55%']],
  contact: [['5%', '16%'], ['68%', '12%'], ['73%', '69%'], ['48%', '22%'], ['91%', '48%']],
  'project-list': [['3%', '72%'], ['72%', '10%'], ['77%', '78%'], ['27%', '18%'], ['91%', '52%']],
}

type AmbientBackgroundProps = {
  variant: AmbientBackgroundVariant
}

export function AmbientBackground({ variant }: AmbientBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const symbolRefs = useRef<Array<HTMLSpanElement | null>>([])
  const symbols: AmbientSymbol[] = sharedSymbols.map((symbol, index) => ({
    ...symbol,
    left: anchors[variant][index][0],
    top: anchors[variant][index][1],
  }))

  useEffect(() => {
    const root = rootRef.current
    const host = root?.parentElement
    if (!root || !host) return

    let safetyFrame = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const refreshSafety = () => {
      const safeZones = Array.from(host.querySelectorAll<HTMLElement>('[data-ambient-safe]'))
      symbolRefs.current.forEach((symbol) => {
        if (!symbol) return
        const rect = symbol.getBoundingClientRect()
        const isNearContent = safeZones.some((zone) => {
          const safeRect = zone.getBoundingClientRect()
          const padding = 32
          return rect.right > safeRect.left - padding
            && rect.left < safeRect.right + padding
            && rect.bottom > safeRect.top - padding
            && rect.top < safeRect.bottom + padding
        })
        const baseOpacity = Number(symbol.dataset.baseOpacity ?? 0.2)
        const safeOpacity = baseOpacity * (isNearContent ? 0.7 : 1)
        symbol.dataset.safeOpacity = String(safeOpacity)
        symbol.style.setProperty('--ambient-opacity', String(safeOpacity))
      })
    }

    const scheduleSafetyRefresh = () => {
      cancelAnimationFrame(safetyFrame)
      safetyFrame = requestAnimationFrame(refreshSafety)
    }

    const resetPointerAvoidance = () => {
      symbolRefs.current.forEach((symbol) => {
        if (!symbol) return
        symbol.style.setProperty('--ambient-avoid-x', '0px')
        symbol.style.setProperty('--ambient-avoid-y', '0px')
        symbol.style.setProperty('--ambient-opacity', symbol.dataset.safeOpacity ?? symbol.dataset.baseOpacity ?? '0.2')
      })
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType !== 'mouse') return
      const radius = 150
      const maxOffset = 18

      symbolRefs.current.forEach((symbol) => {
        if (!symbol) return
        const rect = symbol.getBoundingClientRect()
        const deltaX = rect.left + rect.width / 2 - event.clientX
        const deltaY = rect.top + rect.height / 2 - event.clientY
        const distance = Math.hypot(deltaX, deltaY)
        const influence = Math.max(0, 1 - distance / radius)
        const divisor = distance || 1
        const offsetX = (deltaX / divisor) * maxOffset * influence
        const offsetY = (deltaY / divisor) * maxOffset * influence
        const safeOpacity = Number(symbol.dataset.safeOpacity ?? symbol.dataset.baseOpacity ?? 0.2)

        symbol.style.setProperty('--ambient-avoid-x', `${offsetX.toFixed(2)}px`)
        symbol.style.setProperty('--ambient-avoid-y', `${offsetY.toFixed(2)}px`)
        symbol.style.setProperty('--ambient-opacity', String(safeOpacity * (1 - influence * 0.3)))
      })
    }

    const resizeObserver = new ResizeObserver(scheduleSafetyRefresh)
    resizeObserver.observe(host)
    host.querySelectorAll<HTMLElement>('[data-ambient-safe]').forEach((zone) => resizeObserver.observe(zone))
    host.addEventListener('pointermove', handlePointerMove)
    host.addEventListener('pointerleave', resetPointerAvoidance)
    scheduleSafetyRefresh()

    return () => {
      cancelAnimationFrame(safetyFrame)
      resizeObserver.disconnect()
      host.removeEventListener('pointermove', handlePointerMove)
      host.removeEventListener('pointerleave', resetPointerAvoidance)
    }
  }, [variant])

  return (
    <div ref={rootRef} className="ambient-background" aria-hidden="true">
      <span
        className="ambient-background__corner ambient-background__corner--top"
        style={{ backgroundImage: `url(${pixelCorners})` }}
      />
      <span
        className="ambient-background__corner ambient-background__corner--bottom"
        style={{ backgroundImage: `url(${pixelCorners})` }}
      />
      <FloatingBackgroundSymbols symbols={symbols} symbolRefs={symbolRefs} />
    </div>
  )
}

type FloatingBackgroundSymbolsProps = {
  symbols: AmbientSymbol[]
  symbolRefs: MutableRefObject<Array<HTMLSpanElement | null>>
}

function FloatingBackgroundSymbols({ symbols, symbolRefs }: FloatingBackgroundSymbolsProps) {
  return (
    <span className="ambient-background__symbols">
      {symbols.map((symbol, index) => (
        <span
          ref={(node) => { symbolRefs.current[index] = node }}
          className={`ambient-background__symbol${symbol.mobileHidden ? ' ambient-background__symbol--mobile-hidden' : ''}`}
          data-base-opacity={symbol.opacity}
          key={symbol.key}
          style={{
            insetInlineStart: symbol.left,
            insetBlockStart: symbol.top,
            inlineSize: symbol.width,
            '--ambient-duration': `${symbol.duration}s`,
            '--ambient-delay': `${symbol.delay}s`,
            '--ambient-drift-x': `${symbol.driftX}px`,
            '--ambient-drift-y': `${symbol.driftY}px`,
            '--ambient-rotate': `${symbol.rotate}deg`,
            '--ambient-opacity': symbol.opacity,
          } as CSSProperties}
        >
          <span className="ambient-background__float">
            <img src={symbol.src} alt={symbol.alt} draggable={false} />
          </span>
        </span>
      ))}
    </span>
  )
}
