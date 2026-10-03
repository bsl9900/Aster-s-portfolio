import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import heroBackground from '../../assets/background/hero-cover.png'
import { RippleDistortion } from '../../components/RippleDistortion'
import { TextPressure } from '../../components/TextPressure/TextPressure'
import { FloatingObjects } from './FloatingObjects'
import { HeroComputer } from './HeroComputer'
import './Hero.css'

type Cursor = { x: number; y: number; nx: number; ny: number; active: boolean }

export function Hero() {
  const cursor = useRef<Cursor>({ x: -1000, y: -1000, nx: 0, ny: 0, active: false })
  const [compact, setCompact] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const sync = () => setCompact(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const enterContent = () => {
    window.dispatchEvent(new CustomEvent('portfolio:scene-navigate', { detail: { direction: 'forward' } }))
  }

  return <section className="hero-section" aria-labelledby="hero-title"
    onPointerMove={(event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      cursor.current = {
        x: event.clientX,
        y: event.clientY,
        nx: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)),
        ny: Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)),
        active: true,
      }
    }}
    onPointerLeave={() => { cursor.current = { x: -1000, y: -1000, nx: 0, ny: 0, active: false } }}
  >
    <FloatingObjects cursor={cursor} />
    <RippleDistortion
      overlay
      className="hero-section__ripple"
      src={heroBackground}
      brushSize={180}
      strength={0.04}
      swirl={0.5}
      rings={3}
      spread={4}
      fade={4}
      spacing={18}
      dispersion={0}
      glint={0.25}
      tint="#8fdcff"
      tintAmount={0.08}
      grayscale={false}
      highlightColor="#ffffff"
      trigger="hover"
      clickStrength={1.2}
      quality={compact ? 'low' : 'medium'}
      enabled
    />
    <div className="hero-section__content">
      <motion.h1
        id="hero-title"
        className="hero-section__title"
        onClick={enterContent}
        animate={reduceMotion ? { y: 0, rotate: 0, scale: 1 } : { y: [0, -5, 0], rotate: [-0.2, 0.2, -0.2], scale: [1, 1.005, 1] }}
        transition={{ duration: 5.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      >
        <TextPressure
          sharedCursor={cursor}
          text="PORTFOLIO"
          flex
          alpha={false}
          stroke={false}
          width
          weight
          italic={false}
          textColor="#4FA8FF"
          strokeColor="#4FA8FF"
          minFontSize={36}
          widthStrength={58}
          weightStrength={440}
        />
      </motion.h1>
    </div>
    <HeroComputer cursor={cursor} />
  </section>
}
