import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type ActiveScene = 'cover' | 'content'
type Scene = ActiveScene | 'transitioning'

export function usePortfolioScene() {
  const [scene, setScene] = useState<Scene>('cover')
  const [activeScene, setActiveScene] = useState<ActiveScene>('cover')
  const stageRef = useRef<HTMLDivElement>(null)
  const current = useRef<ActiveScene>('cover')
  const locked = useRef(false)
  const timers = useRef<number[]>([])
  const animation = useRef<Animation | null>(null)
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 120

  const changeScene = useCallback((target: ActiveScene) => {
    if (locked.current || target === current.current) return
    locked.current = true
    setScene('transitioning')
    const ms = duration()
    // Temporary 240ms opacity feedback, not a final page transition or overlay.
    animation.current = stageRef.current?.animate(
      [{ opacity: 1 }, { opacity: 0.94 }], { duration: ms, fill: 'forwards' },
    ) ?? null
    timers.current.push(window.setTimeout(() => {
      animation.current?.cancel()
      current.current = target
      setActiveScene(target)
    }, ms))
  }, [])

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (!locked.current) return
    const ms = duration()
    animation.current = stageRef.current?.animate(
      [{ opacity: 0.94 }, { opacity: 1 }], { duration: ms },
    ) ?? null
    timers.current.push(window.setTimeout(() => {
      animation.current?.cancel()
      locked.current = false
      setScene(activeScene)
    }, ms))
  }, [activeScene])

  useEffect(() => {
    let touchOrigin: { x: number; y: number } | null = null
    let wheelTotal = 0
    let lastWheel = 0
    let computerRotating = false
    const onComputerGesture = (event: Event) => {
      computerRotating = Boolean((event as CustomEvent<{ active: boolean }>).detail?.active)
      // A held computer gesture must never become a swipe on release.
      touchOrigin = null
    }
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return // Preserve the existing internal zoom gesture.
      if (locked.current) { event.preventDefault(); return }
      if (current.current !== 'cover') return
      event.preventDefault()
      if (event.deltaY <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        wheelTotal = 0
        return
      }
      if (event.timeStamp - lastWheel > 180) wheelTotal = 0
      lastWheel = event.timeStamp
      wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
      if (wheelTotal >= 24) { wheelTotal = 0; changeScene('content') }
    }
    const onTouchStart = (event: TouchEvent) => {
      touchOrigin = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) { touchOrigin = null; return }
      if (computerRotating) { touchOrigin = null; return }
      if (locked.current) { if (event.cancelable) event.preventDefault(); return }
      if (current.current !== 'cover' || !touchOrigin) return
      const dy = touchOrigin.y - event.touches[0].clientY
      const dx = touchOrigin.x - event.touches[0].clientX
      if (dy >= 40 && dy > Math.abs(dx)) {
        if (event.cancelable) event.preventDefault()
        touchOrigin = null
        changeScene('content')
      }
    }
    const endTouch = () => { touchOrigin = null }
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ direction?: string; path?: string }>).detail
      if (detail?.direction === 'backward') changeScene('cover')
      else if (detail?.direction === 'forward' || detail?.path === '/about') changeScene('content')
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', endTouch)
    window.addEventListener('touchcancel', endTouch)
    window.addEventListener('portfolio:scene-navigate', onRequest)
    window.addEventListener('portfolio:computer-gesture', onComputerGesture)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', endTouch)
      window.removeEventListener('touchcancel', endTouch)
      window.removeEventListener('portfolio:scene-navigate', onRequest)
      window.removeEventListener('portfolio:computer-gesture', onComputerGesture)
      timers.current.forEach(window.clearTimeout)
      animation.current?.cancel()
    }
  }, [changeScene])

  return { scene, activeScene, stageRef }
}
