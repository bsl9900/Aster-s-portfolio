import { useEffect, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from 'react'

type Point = { x: number; y: number }
type TravelPhotoViewerProps = {
  image: string
  alt: string
  label: string
  onClose: () => void
}

const MIN_SCALE = 1
const MAX_SCALE = 3
const clampScale = (value: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, value))
type TouchPoints = { [index: number]: { clientX: number; clientY: number } }
const distance = (touches: TouchPoints) => Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY)

/** Travel-only viewer: it is bounded by the archive content area, never the page. */
export function TravelPhotoViewer({ image, alt, label, onClose }: TravelPhotoViewerProps) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; start: Point; pan: Point } | null>(null)
  const pinchRef = useRef<{ distance: number; scale: number; pan: Point } | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const updateScale = (nextScale: number) => {
    const safeScale = clampScale(nextScale)
    setScale(safeScale)
    if (safeScale === 1) setPan({ x: 0, y: 0 })
  }

  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || scale <= 1) return
    dragRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, pan }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    event.preventDefault()
  }

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = dragRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    setPan({ x: gesture.pan.x + event.clientX - gesture.start.x, y: gesture.pan.y + event.clientY - gesture.start.y })
    event.preventDefault()
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  const zoomWithWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    updateScale(scale * (event.deltaY < 0 ? 1.15 : 0.87))
  }

  const beginPinch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) pinchRef.current = { distance: distance(event.touches), scale, pan }
  }

  const pinch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchRef.current) return
    event.preventDefault()
    const nextScale = clampScale(pinchRef.current.scale * (distance(event.touches) / pinchRef.current.distance))
    setScale(nextScale)
    if (nextScale === 1) setPan({ x: 0, y: 0 })
  }

  return (
    <section className="travel-photo-viewer" role="dialog" aria-modal="true" aria-label={`${label}图片查看器`}>
      <button className="travel-photo-viewer__backdrop" type="button" onClick={onClose} aria-label="关闭图片查看器" />
      <div className="travel-photo-viewer__frame">
        <header className="travel-photo-viewer__header">
          <strong>{label}</strong>
          <div className="travel-photo-viewer__controls" aria-label="图片缩放">
            <button type="button" onClick={() => updateScale(scale - 0.25)} aria-label="缩小图片">−</button>
            <output>{Math.round(scale * 100)}%</output>
            <button type="button" onClick={() => updateScale(scale + 0.25)} aria-label="放大图片">＋</button>
            <button type="button" onClick={() => updateScale(1)}>适合窗口</button>
          </div>
          <button className="travel-photo-viewer__close" type="button" onClick={onClose} aria-label="关闭图片查看器">×</button>
        </header>
        <div className={`travel-photo-viewer__canvas${dragging ? ' is-dragging' : ''}`} ref={canvasRef} onWheel={zoomWithWheel} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onTouchStart={beginPinch} onTouchMove={pinch} onTouchEnd={() => { pinchRef.current = null }} onTouchCancel={() => { pinchRef.current = null }}>
          <img src={image} alt={alt} draggable={false} style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})` }} />
        </div>
      </div>
    </section>
  )
}
