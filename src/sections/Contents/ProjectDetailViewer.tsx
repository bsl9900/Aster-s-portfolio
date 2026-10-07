import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { ProjectDetailSection } from './projectSections'
import { useInitialProjectImage } from './useInitialProjectImage'

const MIN_SCALE = 1
const MAX_SCALE = 3

type Point = { x: number; y: number }
type TouchGesture =
  | { type: 'pinch'; distance: number; scale: number; doc: Point }
  | { type: 'pan'; point: Point; pan: Point }
  | null

type ProjectDetailViewerProps = {
  images: string[]
  projectId: string
  sections: ProjectDetailSection[]
  title: string
}

const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
const touchPoint = (touch: Touch): Point => ({ x: touch.clientX, y: touch.clientY })
const touchMidpoint = (touches: TouchList): Point => ({
  x: (touches[0].clientX + touches[1].clientX) / 2,
  y: (touches[0].clientY + touches[1].clientY) / 2,
})
const touchDistance = (touches: TouchList) => Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY)

export function ProjectDetailViewer({ images, projectId, sections, title }: ProjectDetailViewerProps) {
  const initialImage = useInitialProjectImage(images[0])
  // Count finished detail images so the existing spinner can show "3 / 22" while
  // a chapter loads; a chapter with several images downloads them one by one on
  // a slow link and readers otherwise have no idea whether anything is coming.
  const [loadedCount, setLoadedCount] = useState(0)
  const totalImages = images.length
  const viewportRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const scaleRef = useRef(MIN_SCALE)
  const panRef = useRef<Point>({ x: 0, y: 0 })
  const touchGestureRef = useRef<TouchGesture>(null)
  const mouseDragRef = useRef<{ pointerId: number; point: Point; pan: Point } | null>(null)
  const touchNavCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scale, setScale] = useState(MIN_SCALE)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? '')
  const [expandedTouchSectionId, setExpandedTouchSectionId] = useState<string | null>(null)

  const collapseTouchSection = () => {
    if (touchNavCollapseTimerRef.current) clearTimeout(touchNavCollapseTimerRef.current)
    touchNavCollapseTimerRef.current = null
    setExpandedTouchSectionId(null)
  }

  const temporarilyExpandTouchSection = (sectionId: string) => {
    if (touchNavCollapseTimerRef.current) clearTimeout(touchNavCollapseTimerRef.current)
    setExpandedTouchSectionId(sectionId)
    touchNavCollapseTimerRef.current = setTimeout(() => {
      setExpandedTouchSectionId(null)
      touchNavCollapseTimerRef.current = null
    }, 500)
  }

  useEffect(() => () => {
    if (touchNavCollapseTimerRef.current) clearTimeout(touchNavCollapseTimerRef.current)
  }, [])

  const surfaceMetrics = () => {
    const viewport = viewportRef.current
    const surface = surfaceRef.current
    return {
      viewport,
      surface,
      baseLeft: surface?.offsetLeft ?? 0,
      baseTop: surface?.offsetTop ?? 0,
      width: surface?.offsetWidth ?? 0,
      height: surface?.offsetHeight ?? 0,
      viewportWidth: viewport?.clientWidth ?? 0,
      viewportHeight: viewport?.clientHeight ?? 0,
    }
  }

  const constrainPan = (candidate: Point, nextScale = scaleRef.current): Point => {
    if (nextScale <= MIN_SCALE) return { x: 0, y: 0 }
    const { baseLeft, baseTop, width, height, viewportWidth, viewportHeight } = surfaceMetrics()
    const minX = Math.min(-baseLeft, viewportWidth - baseLeft - width * nextScale)
    const maxX = -baseLeft
    const minY = Math.min(-baseTop, viewportHeight - baseTop - height * nextScale)
    const maxY = -baseTop
    return {
      x: Math.min(maxX, Math.max(minX, candidate.x)),
      y: Math.min(maxY, Math.max(minY, candidate.y)),
    }
  }

  const commitView = (nextScale: number, nextPan: Point) => {
    const safeScale = clampScale(nextScale)
    const safePan = constrainPan(nextPan, safeScale)
    scaleRef.current = safeScale
    panRef.current = safePan
    setScale(safeScale)
    setPan(safePan)
  }

  const localPoint = (clientPoint: Point): Point => {
    const bounds = viewportRef.current?.getBoundingClientRect()
    return bounds ? { x: clientPoint.x - bounds.left, y: clientPoint.y - bounds.top } : { x: 0, y: 0 }
  }

  const documentPointAt = (focus: Point): Point => {
    const viewport = viewportRef.current
    const { baseLeft, baseTop } = surfaceMetrics()
    const currentScale = scaleRef.current
    if (!viewport || currentScale <= MIN_SCALE) {
      return { x: focus.x - baseLeft, y: focus.y + (viewport?.scrollTop ?? 0) - baseTop }
    }
    return {
      x: (focus.x - baseLeft - panRef.current.x) / currentScale,
      y: (focus.y - baseTop - panRef.current.y) / currentScale,
    }
  }

  const zoomAround = (nextScaleValue: number, focus: Point, documentPoint = documentPointAt(focus)) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const nextScale = clampScale(nextScaleValue)
    const { baseLeft, baseTop } = surfaceMetrics()
    if (nextScale <= MIN_SCALE) {
      scaleRef.current = MIN_SCALE
      panRef.current = { x: 0, y: 0 }
      setScale(MIN_SCALE)
      setPan({ x: 0, y: 0 })
      requestAnimationFrame(() => {
        viewport.scrollTop = Math.max(0, baseTop + documentPoint.y - focus.y)
      })
      return
    }
    viewport.scrollTop = 0
    commitView(nextScale, {
      x: focus.x - baseLeft - documentPoint.x * nextScale,
      y: focus.y - baseTop - documentPoint.y * nextScale,
    })
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const focus = localPoint({ x: event.clientX, y: event.clientY })
      const factor = event.deltaY < 0 ? 1.12 : 0.89
      zoomAround(scaleRef.current * factor, focus)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) collapseTouchSection()
      if (event.touches.length === 2) {
        event.preventDefault()
        const focus = localPoint(touchMidpoint(event.touches))
        touchGestureRef.current = { type: 'pinch', distance: touchDistance(event.touches), scale: scaleRef.current, doc: documentPointAt(focus) }
      } else if (event.touches.length === 1 && scaleRef.current > MIN_SCALE) {
        event.preventDefault()
        touchGestureRef.current = { type: 'pan', point: touchPoint(event.touches[0]), pan: panRef.current }
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      const gesture = touchGestureRef.current
      if (event.touches.length === 2) {
        event.preventDefault()
        const focus = localPoint(touchMidpoint(event.touches))
        const pinch = gesture?.type === 'pinch'
          ? gesture
          : { type: 'pinch' as const, distance: touchDistance(event.touches), scale: scaleRef.current, doc: documentPointAt(focus) }
        touchGestureRef.current = pinch
        zoomAround(pinch.scale * (touchDistance(event.touches) / Math.max(pinch.distance, 1)), focus, pinch.doc)
      } else if (event.touches.length === 1 && scaleRef.current > MIN_SCALE) {
        event.preventDefault()
        const point = touchPoint(event.touches[0])
        const drag = gesture?.type === 'pan' ? gesture : { type: 'pan' as const, point, pan: panRef.current }
        touchGestureRef.current = drag
        commitView(scaleRef.current, { x: drag.pan.x + point.x - drag.point.x, y: drag.pan.y + point.y - drag.point.y })
      }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 1 && scaleRef.current > MIN_SCALE) {
        touchGestureRef.current = { type: 'pan', point: touchPoint(event.touches[0]), pan: panRef.current }
      } else {
        touchGestureRef.current = null
      }
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false })
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false })
    viewport.addEventListener('touchend', handleTouchEnd)
    viewport.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      viewport.removeEventListener('touchstart', handleTouchStart)
      viewport.removeEventListener('touchmove', handleTouchMove)
      viewport.removeEventListener('touchend', handleTouchEnd)
      viewport.removeEventListener('touchcancel', handleTouchEnd)
      touchGestureRef.current = null
      mouseDragRef.current = null
    }
  }, [])

  useEffect(() => {
    const surface = surfaceRef.current
    const viewport = viewportRef.current
    if (!surface || !viewport || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (scaleRef.current > MIN_SCALE) commitView(scaleRef.current, panRef.current)
    })
    observer.observe(surface)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  const beginMousePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || scaleRef.current <= MIN_SCALE) return
    mouseDragRef.current = { pointerId: event.pointerId, point: { x: event.clientX, y: event.clientY }, pan: panRef.current }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    event.preventDefault()
  }

  const moveMousePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mouseDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.preventDefault()
    commitView(scaleRef.current, { x: drag.pan.x + event.clientX - drag.point.x, y: drag.pan.y + event.clientY - drag.point.y })
  }

  const endMousePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mouseDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    mouseDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setIsDragging(false)
  }

  const jumpToSection = (sectionId: string) => {
    const viewport = viewportRef.current
    const surface = surfaceRef.current
    const target = sectionRefs.current[sectionId]
    if (!viewport || !surface || !target) return
    setActiveSectionId(sectionId)
    const section = sections.find((item) => item.id === sectionId)
    const firstImage = target.querySelector<HTMLImageElement>('.project-detail-image')
    const targetTop = target.offsetTop + (firstImage?.offsetHeight ?? 0) * (section?.anchorOffsetRatio ?? 0)
    if (scaleRef.current <= MIN_SCALE) {
      viewport.scrollTo({ top: surface.offsetTop + targetTop, behavior: 'smooth' })
      return
    }
    const { baseTop } = surfaceMetrics()
    commitView(scaleRef.current, { x: panRef.current.x, y: -baseTop - targetTop * scaleRef.current })
  }

  const selectSection = (sectionId: string) => {
    const usesTouchNavigation = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (usesTouchNavigation) temporarilyExpandTouchSection(sectionId)
    else collapseTouchSection()
    jumpToSection(sectionId)
  }

  return <div className="project-detail-viewer">
    <nav className="contents-section__section-nav" aria-label="项目章节快捷导航">
      <div className="contents-section__section-nav-list">
        {sections.map((section, index) => <button
          className={`contents-section__section-nav-item${activeSectionId === section.id ? ' is-active' : ''}${expandedTouchSectionId === section.id ? ' is-touch-expanded' : ''}`}
          type="button"
          key={section.id}
          onClick={() => selectSection(section.id)}
          aria-current={activeSectionId === section.id ? 'location' : undefined}
          aria-label={`${String(index + 1).padStart(2, '0')} ${section.label}`}
        >
          <span className="contents-section__section-nav-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="contents-section__section-nav-label">{section.label}</span>
        </button>)}
      </div>
    </nav>
    <div
      className={`contents-section__modal-content${scale > MIN_SCALE ? ' is-zoomed' : ''}${isDragging ? ' is-dragging' : ''}`}
      data-scale={scale.toFixed(2)}
      aria-busy={initialImage.state === 'loading'}
      ref={viewportRef}
      onPointerDown={beginMousePan}
      onPointerMove={moveMousePan}
      onPointerUp={endMousePan}
      onPointerCancel={endMousePan}
    >
      <div className={`project-detail-content${initialImage.state === 'loading' ? ' is-initial-loading' : ''}`} ref={surfaceRef} style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})` }}>
        {sections.map((section, sectionIndex) => {
          const nextSection = sections[sectionIndex + 1]
          const sectionImages = images.slice(section.startImageIndex, nextSection?.startImageIndex ?? images.length)
          return <section
            className="project-detail-section"
            data-section-id={section.id}
            id={section.id.startsWith('project-') ? section.id : `${projectId}-${section.id}`}
            key={section.id}
            ref={(node) => { sectionRefs.current[section.id] = node }}
          >
            {sectionImages.map((image, imageIndex) => {
              const absoluteIndex = section.startImageIndex + imageIndex
              return <img
                className={`project-detail-image${absoluteIndex === 0 && initialImage.state === 'error' ? ' is-load-error' : ''}`}
                ref={absoluteIndex === 0 ? initialImage.imageRef : undefined}
                src={absoluteIndex === 0 ? initialImage.src : image}
                alt={`${title}详情第 ${absoluteIndex + 1} 页`}
                loading={absoluteIndex === 0 ? 'eager' : 'lazy'}
                fetchPriority={absoluteIndex === 0 ? 'high' : 'auto'}
                onLoad={() => setLoadedCount((count) => Math.min(count + 1, totalImages))}
                draggable={false}
                key={absoluteIndex === 0 ? initialImage.src : image}
              />
            })}
          </section>
        })}
      </div>
    </div>
    <div className={`project-detail-loading${initialImage.state === 'loading' ? ' is-visible' : ''}`} role="status" aria-label={initialImage.state === 'loading' ? '正在加载项目内容' : undefined} aria-hidden={initialImage.state !== 'loading'}>
      <span className="project-detail-loading__spinner" aria-hidden="true" />
      {totalImages > 1 && <span className="project-detail-loading__count" aria-hidden="true">{loadedCount} / {totalImages}</span>}
    </div>
    {initialImage.state === 'error' && <div className="project-detail-load-error">
      <button type="button" onClick={initialImage.retry} aria-label="首图加载失败，点击重试" title="重试加载">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.1 8a8 8 0 0 1 13.2-2L20 8M4 16l1.7 2A8 8 0 0 0 18.9 16" /></svg>
      </button>
    </div>}
  </div>
}
