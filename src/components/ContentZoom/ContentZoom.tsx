import { CSSProperties, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import './ContentZoom.css'

const minimumZoom = 0.6
const maximumZoom = 2

const clamp = (value: number) => Math.min(maximumZoom, Math.max(minimumZoom, value))
const distanceBetweenTouches = (touches: TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

export function ContentZoom({ children }: PropsWithChildren) {
  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1)
  const pinchDistance = useRef<number | null>(null)

  const updateScale = useCallback((nextScale: number) => {
    const boundedScale = Number(clamp(nextScale).toFixed(3))
    scaleRef.current = boundedScale
    setScale(boundedScale)
  }, [])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      updateScale(scaleRef.current * Math.exp(-event.deltaY * 0.0015))
    }
    const onTouchStart = (event: TouchEvent) => {
      pinchDistance.current = event.touches.length === 2 ? distanceBetweenTouches(event.touches) : null
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchDistance.current === null) return
      event.preventDefault()
      const nextDistance = distanceBetweenTouches(event.touches)
      updateScale(scaleRef.current * (nextDistance / pinchDistance.current))
      pinchDistance.current = nextDistance
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchDistance.current = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [updateScale])

  return <div className="content-zoom" style={{ '--content-zoom': scale } as CSSProperties} data-zoom={scale}>
    <div className="content-zoom__canvas">{children}</div>
    <button className="content-zoom__reset" type="button" title="Reset Zoom" aria-label={`Reset zoom to 100 percent (currently ${Math.round(scale * 100)} percent)`} onClick={() => updateScale(1)}>{Math.round(scale * 100)}%</button>
  </div>
}
