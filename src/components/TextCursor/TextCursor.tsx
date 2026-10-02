import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import './TextCursor.css'

type TextCursorProps = { text: string; spacing: number; followMouseDirection?: boolean; randomFloat?: boolean; exitDuration?: number; removalInterval?: number; maxPoints?: number }
type CursorPoint = { id: number; x: number; y: number; angle: number; character: string; floatX: number; floatY: number }

export default function TextCursor({ text, spacing, followMouseDirection = false, randomFloat = false, exitDuration = 0.3, removalInterval = 20, maxPoints = 10 }: TextCursorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [points, setPoints] = useState<CursorPoint[]>([])
  const last = useRef({ x: 0, y: 0, time: 0, id: 0 })

  useEffect(() => {
    const root = rootRef.current
    const container = root?.parentElement
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    if (!container || !media.matches) return
    const characters = [...text].filter((character) => character.trim())
    const move = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top
      const distance = Math.hypot(x - last.current.x, y - last.current.y); const now = performance.now()
      if (distance < spacing || now - last.current.time < removalInterval) return
      const angle = followMouseDirection ? Math.atan2(y - last.current.y, x - last.current.x) * (180 / Math.PI) : 0
      const point: CursorPoint = { id: last.current.id++, x, y, angle, character: characters[last.current.id % characters.length] ?? '✦', floatX: randomFloat ? (Math.random() - 0.5) * 12 : 0, floatY: randomFloat ? (Math.random() - 0.5) * 12 : 0 }
      setPoints((current) => [...current, point].slice(-maxPoints)); last.current = { x, y, time: now, id: last.current.id }
    }
    container.addEventListener('pointermove', move)
    return () => container.removeEventListener('pointermove', move)
  }, [followMouseDirection, maxPoints, randomFloat, removalInterval, spacing, text])

  return <div ref={rootRef} className="text-cursor" aria-hidden="true"><AnimatePresence>{points.map((point) => <motion.span key={point.id} className="text-cursor__point" initial={{ opacity: 0, scale: 0.35, x: point.x, y: point.y, rotate: point.angle }} animate={{ opacity: 0.8, scale: 1, x: point.x + point.floatX, y: point.y + point.floatY, rotate: point.angle }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: exitDuration, ease: 'easeOut' }} onAnimationComplete={() => setPoints((current) => current.filter((item) => item.id !== point.id))}>{point.character}</motion.span>)}</AnimatePresence></div>
}
