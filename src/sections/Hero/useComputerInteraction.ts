import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useSpring } from 'motion/react'

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))
type Gesture = { id: number; x: number; y: number; touch: boolean; moved: boolean; rotating: boolean }

export function useComputerInteraction(reduced: boolean | null) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const rotateX = useSpring(0, { stiffness: 150, damping: 19 })
  const rotateY = useSpring(0, { stiffness: 150, damping: 19 })
  const clearTimer = () => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null }
  const announce = (active: boolean) => window.dispatchEvent(new CustomEvent('portfolio:computer-gesture', { detail: { active } }))
  const reset = () => { rotateX.set(0); rotateY.set(0) }
  const finish = () => {
    clearTimer()
    const current = gesture.current
    if (current) {
      suppressClick.current = current.moved || current.rotating
      if (buttonRef.current?.hasPointerCapture(current.id)) buttonRef.current.releasePointerCapture(current.id)
    }
    gesture.current = null
    setDragging(false)
    if (current?.touch && current.rotating) announce(false)
    reset()
  }

  useEffect(() => {
    const button = buttonRef.current
    // Only a confirmed long-press rotation cancels native touch panning.
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) { suppressClick.current = true; finish(); return }
      if (gesture.current?.rotating && event.cancelable) event.preventDefault()
    }
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length > 1) { finish(); suppressClick.current = true }
    }
    const cancel = () => { finish(); suppressClick.current = true }
    button?.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('blur', cancel)
    return () => {
      clearTimer()
      announce(false)
      button?.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('blur', cancel)
    }
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    clearTimer()
    suppressClick.current = false
    const current: Gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, touch: event.pointerType !== 'mouse', moved: false, rotating: false }
    gesture.current = current
    if (!current.touch) event.currentTarget.setPointerCapture(current.id)
    else timer.current = setTimeout(() => {
      if (gesture.current !== current || current.moved) return
      current.rotating = true
      suppressClick.current = true
      setDragging(true)
      buttonRef.current?.setPointerCapture(current.id)
      announce(true)
    }, 300)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = gesture.current
    if (current && current.id === event.pointerId) {
      const dx = event.clientX - current.x
      const dy = event.clientY - current.y
      if (Math.hypot(dx, dy) >= 8) {
        current.moved = true
        suppressClick.current = true
        if (!current.touch) { current.rotating = true; setDragging(true) }
        else if (!current.rotating) clearTimer()
      }
      if (current.rotating) {
        rotateX.set(reduced ? 0 : clamp(-dy * 0.22, current.touch ? 16 : 18))
        rotateY.set(reduced ? 0 : clamp(dx * 0.3, current.touch ? 26 : 30))
      }
      return
    }
    if (event.pointerType !== 'mouse' || reduced) return
    // Measure the stable floating parent, not the already rotated button.
    const rect = event.currentTarget.parentElement!.getBoundingClientRect()
    rotateX.set(clamp(-((event.clientY - rect.top) / rect.height * 2 - 1) * 7, 7))
    rotateY.set(clamp(((event.clientX - rect.left) / rect.width * 2 - 1) * 11, 11))
    // Pointer movement intentionally bubbles to Hero's shared TextPressure cursor.
  }
  return {
    buttonRef, rotateX, rotateY, dragging,
    handlers: {
      onPointerDown, onPointerMove,
      onPointerUp: finish,
      onPointerCancel: () => { finish(); suppressClick.current = true },
      onLostPointerCapture: () => { if (gesture.current) finish() },
      onPointerLeave: () => { if (!gesture.current) reset() },
      onBlur: () => { finish(); suppressClick.current = true },
      onContextMenu: (event: React.MouseEvent) => { if (gesture.current?.touch) event.preventDefault() },
      onClick: (event: React.MouseEvent) => {
        if (event.detail !== 0 && suppressClick.current) { event.preventDefault(); return }
        window.dispatchEvent(new CustomEvent('portfolio:scene-navigate', { detail: { direction: 'forward' } }))
      },
    },
  }
}
