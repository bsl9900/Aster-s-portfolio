import { useEffect, useState, useRef } from 'react'
import heroBackground from '../../assets/background/hero-cover.png'
import { RippleDistortion } from '../../components/RippleDistortion'
import { TextPressure } from '../../components/TextPressure/TextPressure'
import { HeroComputer } from './HeroComputer'
import './Hero.css'
export function Hero() {
  const cursor = useRef({ x: -1000, y: -1000, nx: 0, ny: 0, active: false })
  const [compact, setCompact] = useState(false)
  useEffect(() => { const query = window.matchMedia('(max-width: 767px)'); const sync = () => setCompact(query.matches); sync(); query.addEventListener('change', sync); return () => query.removeEventListener('change', sync) }, [])
  return <section className="hero-section" aria-labelledby="hero-title" onPointerMove={(event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    cursor.current = { x: event.clientX, y: event.clientY, nx: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)), ny: Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)), active: true }
  }} onPointerLeave={() => { cursor.current = { x: -1000, y: -1000, nx: 0, ny: 0, active: false } }}><RippleDistortion className="hero-section__ripple" src={heroBackground} brushSize={180} strength={0.04} swirl={0.5} rings={3} spread={4} fade={4} spacing={18} dispersion={0} glint={0.25} tint="#8fdcff" tintAmount={0.08} grayscale={false} highlightColor="#ffffff" trigger="hover" clickStrength={1.2} quality={compact ? 'low' : 'medium'} enabled /><div className="hero-section__content"><h1 id="hero-title" className="hero-section__title"><TextPressure sharedCursor={cursor} text="PORTFOLIO" flex alpha={false} stroke={false} width weight italic={false} textColor="#4FA8FF" strokeColor="#4FA8FF" minFontSize={36} widthStrength={58} weightStrength={440} /></h1></div><HeroComputer cursor={cursor} /></section>
}
