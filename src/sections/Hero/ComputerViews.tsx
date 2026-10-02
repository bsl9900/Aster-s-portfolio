import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import front from '../../assets/hero/hero-computer.png'
import left from '../../assets/hero/computer-turn-left.png'
import right from '../../assets/hero/computer-turn-right.png'
import './ComputerViews.css'

// Read-only presentation: the frozen interaction hook owns all input and rotation.
function blend(angle: number) {
  const t = Math.min(1, Math.max(0, (Math.abs(angle) - 6) / 20))
  return t * t * (3 - 2 * t)
}

export function ComputerViews({ angle }: { angle: MotionValue<number> }) {
  const leftReady = useMotionValue(0)
  const rightReady = useMotionValue(0)
  const [failed, setFailed] = useState({ left: false, right: false })
  const leftOpacity = useTransform(() => angle.get() < 0 ? blend(angle.get()) * leftReady.get() : 0)
  const rightOpacity = useTransform(() => angle.get() > 0 ? blend(angle.get()) * rightReady.get() : 0)
  const frontOpacity = useTransform(() => 1 - leftOpacity.get() - rightOpacity.get())
  // The side assets already contain perspective; avoid doubling their baked-in yaw.
  const compensateYaw = useTransform(() => -angle.get() * 0.8 * (leftOpacity.get() + rightOpacity.get()))

  return <motion.span className="hero-computer-views" style={{ rotateY: compensateYaw }}>
    <motion.img className="hero-computer__image hero-computer-views__front" src={front}
      alt="Retro portfolio computer" draggable={false} style={{ opacity: frontOpacity }} />
    {!failed.left && <motion.img className="hero-computer-views__angle hero-computer-views__angle--left"
      src={left} alt="" aria-hidden="true" draggable={false} decoding="async"
      onLoad={() => leftReady.set(1)} onError={() => { leftReady.set(0); setFailed(state => ({ ...state, left: true })) }}
      style={{ opacity: leftOpacity }} />}
    {!failed.right && <motion.img className="hero-computer-views__angle hero-computer-views__angle--right"
      src={right} alt="" aria-hidden="true" draggable={false} decoding="async"
      onLoad={() => rightReady.set(1)} onError={() => { rightReady.set(0); setFailed(state => ({ ...state, right: true })) }}
      style={{ opacity: rightOpacity }} />}
  </motion.span>
}
