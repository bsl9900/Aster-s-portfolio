import { useEffect, useRef, useState } from 'react'
import './TechText.css'

type TechTextProps = {
  text: string; fontFamily: string; fontWeight: number; fontSize: number; reveal: 'letter'; dashLength: number; dashGap: number; specks: number; color: string; accentColor: string; letterSpacing: number; reach: number; softness: number; strokeWidth: number; speed: number; lineStyle: 'dashed' | 'solid'; selection?: boolean; labels?: boolean; draggable?: boolean; sweep?: boolean
}
type Letter = { char: string; baseX: number; x: number; y: number; width: number; offsetX: number; offsetY: number }

export function TechText({ text, fontFamily, fontWeight, fontSize, reveal, dashLength, dashGap, specks, color, accentColor, letterSpacing, reach, softness, strokeWidth, speed, lineStyle, selection, labels, draggable, sweep }: TechTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const pointerRef = useRef({ x: -9999, y: -9999, down: false })
  const dragRef = useRef<{ index: number; x: number; y: number } | null>(null)
  const lettersRef = useRef<Letter[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0; let height = 0; let dpr = 1; let started = performance.now()
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); width = rect.width; height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr)); canvas.height = Math.max(1, Math.floor(height * dpr)); context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const size = Math.min(fontSize, width / Math.max(text.length * 0.59, 1), height * 0.52)
      context.font = `${fontWeight} ${size}px ${fontFamily}`
      const widths = [...text].map((char) => context.measureText(char).width)
      const spacing = size * letterSpacing; const total = widths.reduce((sum, item) => sum + item, 0) + spacing * (text.length - 1)
      let x = (width - total) / 2
      lettersRef.current = [...text].map((char, index) => { const item = { char, baseX: x, x, y: height / 2 + size * 0.34, width: widths[index], offsetX: 0, offsetY: 0 }; x += widths[index] + spacing; return item })
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize()
    const draw = (time: number) => {
      const elapsed = (time - started) / 1000; const pointer = pointerRef.current; const active = selected ?? lettersRef.current.findIndex((letter) => pointer.x >= letter.x && pointer.x <= letter.x + letter.width && pointer.y >= letter.y - fontSize && pointer.y <= letter.y + fontSize * 0.18)
      context.clearRect(0, 0, width, height)
      context.fillStyle = color; context.font = `${fontWeight} ${Math.min(fontSize, width / Math.max(text.length * 0.59, 1), height * 0.52)}px ${fontFamily}`; context.textBaseline = 'alphabetic'
      lettersRef.current.forEach((letter, index) => {
        const cx = letter.x + letter.width / 2; const cy = letter.y - fontSize * 0.4; const distance = Math.hypot(pointer.x - cx, pointer.y - cy); const influence = Math.max(0, 1 - distance / reach)
        const sweepShift = sweep && !reducedMotion ? Math.sin(elapsed * speed * 1.2 - index * 0.67) * 2.2 : 0
        const visualX = letter.x + letter.offsetX + (pointer.x - cx) * influence * softness * 0.08; const visualY = letter.y + letter.offsetY + (pointer.y - cy) * influence * softness * 0.08 + sweepShift
        context.fillText(letter.char, visualX, visualY)
        if (index === active || distance < reach * 0.62) {
          context.save(); context.strokeStyle = accentColor; context.lineWidth = strokeWidth; context.setLineDash(lineStyle === 'dashed' ? [dashLength, dashGap] : []); context.strokeRect(visualX - 5, visualY - fontSize * 0.93, letter.width + 10, fontSize * 1.12); context.restore()
          if (labels && index === active) { context.fillStyle = accentColor; context.font = '10px ui-monospace, monospace'; context.fillText(`${Math.round(letter.width)} × ${Math.round(fontSize)}`, visualX - 4, visualY - fontSize - 10) }
        }
      })
      for (let index = 0; index < specks; index += 1) { const seed = index * 71.31; const x = (Math.sin(seed + elapsed * speed * 0.3) * 0.5 + 0.5) * width; const y = (Math.cos(seed * 1.7 + elapsed * speed * 0.22) * 0.5 + 0.5) * height; context.fillStyle = `${accentColor}66`; context.fillRect(x, y, 1, 1) }
      frameRef.current = requestAnimationFrame(draw)
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => { observer.disconnect(); cancelAnimationFrame(frameRef.current) }
  }, [accentColor, color, dashGap, dashLength, fontFamily, fontSize, fontWeight, labels, letterSpacing, lineStyle, reach, reveal, selected, softness, specks, speed, strokeWidth, sweep, text])

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } }
  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => { const location = point(event); pointerRef.current = { ...location, down: true }; const index = lettersRef.current.findIndex((letter) => location.x >= letter.x && location.x <= letter.x + letter.width && location.y >= letter.y - fontSize && location.y <= letter.y + fontSize * 0.2); if (index >= 0) { setSelected(selection ? index : null); if (draggable) { dragRef.current = { index, x: location.x, y: location.y }; event.currentTarget.setPointerCapture(event.pointerId) } } }
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => { const location = point(event); pointerRef.current = { ...location, down: pointerRef.current.down }; const drag = dragRef.current; if (drag) { const letter = lettersRef.current[drag.index]; letter.offsetX += location.x - drag.x; letter.offsetY += location.y - drag.y; drag.x = location.x; drag.y = location.y } }
  const onPointerUp = () => { pointerRef.current.down = false; dragRef.current = null }
  return <div className="tech-text"><canvas ref={canvasRef} className="tech-text-canvas" role="img" aria-label={text} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} /></div>
}
