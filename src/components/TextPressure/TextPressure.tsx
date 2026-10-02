import { useEffect, useRef, RefObject } from 'react'
import './TextPressure.css'

type TextPressureProps = { sharedCursor?: RefObject<{ x: number; y: number }>; text: string; flex?: boolean; alpha?: boolean; stroke?: boolean; width?: boolean; weight?: boolean; italic?: boolean; textColor?: string; strokeColor?: string; minFontSize?: number; widthStrength?: number; weightStrength?: number }
type LetterState = { width: number; weight: number; italic: number; targetWidth: number; targetWeight: number; targetItalic: number }

export function TextPressure({ sharedCursor, text, flex = true, alpha = false, stroke = false, width = true, weight = true, italic = true, textColor = '#000000', strokeColor = '#000000', minFontSize = 36, widthStrength = 22, weightStrength = 230 }: TextPressureProps) {
  const rootRef = useRef<HTMLDivElement>(null); const letterRefs = useRef<Array<HTMLSpanElement | null>>([]); const states = useRef<LetterState[]>([]); const mouseRef = useRef({ x: -1000, y: -1000 }); const cursorRef = useRef({ x: -1000, y: -1000 })
  useEffect(() => {
    const root = rootRef.current; if (!root) return
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    const reset = () => { states.current = [...text].map(() => ({ width: 100, weight: 500, italic: 0, targetWidth: 100, targetWeight: 500, targetItalic: 0 })) }
    const resize = () => { const rect = root.getBoundingClientRect(); const size = Math.max(minFontSize, Math.min(rect.width / Math.max(text.length * 0.57, 1), rect.height * 0.78)); root.style.setProperty('--text-pressure-size', `${size}px`); reset() }
    const observer = new ResizeObserver(resize); observer.observe(root); resize()
    let animation = 0
    const frame = () => { if (sharedCursor) mouseRef.current = sharedCursor.current; cursorRef.current.x += (mouseRef.current.x - cursorRef.current.x) * 0.14; cursorRef.current.y += (mouseRef.current.y - cursorRef.current.y) * 0.14; letterRefs.current.forEach((letter, index) => { if (!letter) return; const rect = letter.getBoundingClientRect(); const distance = Math.hypot(cursorRef.current.x - (rect.left + rect.width / 2), cursorRef.current.y - (rect.top + rect.height / 2)); const force = media.matches ? Math.max(0, 1 - distance / 260) : 0; const state = states.current[index]; state.targetWidth = width ? 100 + force * widthStrength : 100; state.targetWeight = weight ? 500 + force * weightStrength : 500; state.targetItalic = italic ? -force * 7 : 0; state.width += (state.targetWidth - state.width) * 0.12; state.weight += (state.targetWeight - state.weight) * 0.12; state.italic += (state.targetItalic - state.italic) * 0.12; letter.style.fontVariationSettings = `'wdth' ${state.width}, 'wght' ${state.weight}, 'slnt' ${state.italic}` }); animation = requestAnimationFrame(frame) }
    animation = requestAnimationFrame(frame)
    return () => { observer.disconnect(); cancelAnimationFrame(animation) }
  }, [sharedCursor, italic, minFontSize, text, weight, weightStrength, width, widthStrength])
  const move = (event: React.PointerEvent<HTMLDivElement>) => { mouseRef.current = { x: event.clientX, y: event.clientY } }; const leave = () => { mouseRef.current = { x: -1000, y: -1000 } }
  return <div ref={rootRef} className={`text-pressure${flex ? ' text-pressure--flex' : ''}`} onPointerMove={sharedCursor ? undefined : move} onPointerLeave={sharedCursor ? undefined : leave} style={{ color: textColor, WebkitTextStroke: stroke ? `1px ${strokeColor}` : undefined, opacity: alpha ? 0.9 : 1 }}>{[...text].map((letter, index) => <span className="text-pressure__letter" key={`${letter}-${index}`} ref={(node) => { letterRefs.current[index] = node }}>{letter}</span>)}</div>
}
