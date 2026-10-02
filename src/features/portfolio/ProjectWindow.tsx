import { useEffect, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from 'react'
import type { PortfolioProject } from '../../content/portfolioProjects'
import './PortfolioWindows.css'

const MIN_READING_SCALE = 0.5
const MAX_READING_SCALE = 2.4
const READING_SCALE_STEP = 0.15

type Point = { x: number; y: number }
type ProjectWindowProps = {
  project: PortfolioProject
  contentViewport: HTMLElement | null
  isActive: boolean
  onNavigate: (target: string, projectId?: string) => void
  onContentResize: (projectId: string) => void
}

const clampScale = (value: number) => Math.min(MAX_READING_SCALE, Math.max(MIN_READING_SCALE, value))
const touchDistance = (touches: { [index: number]: { clientX: number; clientY: number } }) => Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY)
const touchMidpoint = (touches: { [index: number]: { clientX: number; clientY: number } }): Point => ({ x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 })

/** A continuous project reader. Only its artwork canvas can be transformed. */
export function ProjectWindow({ project, contentViewport, isActive, onNavigate, onContentResize }: ProjectWindowProps) {
  const visibleChapters = project.chapters?.filter((chapter) => chapter.visible !== false) ?? []
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [isOverview, setIsOverview] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [activeChapterId, setActiveChapterId] = useState(visibleChapters[0]?.id ?? '')
  const [isDragging, setIsDragging] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const readerBarRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const chapterNavRef = useRef<HTMLElement>(null)
  const chapterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const scaleRef = useRef(scale)
  const panRef = useRef(pan)
  const overviewRef = useRef(isOverview)
  const spacePressedRef = useRef(false)
  const dragRef = useRef<{ pointerId: number; start: Point; pan: Point } | null>(null)
  const pinchRef = useRef<{ distance: number; midpoint: Point; scale: number; pan: Point } | null>(null)
  const hasReaderControls = Boolean(visibleChapters.length || project.sections.some((section) => section.images.length > 0))

  const getStageMetrics = () => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    return {
      width: stage?.clientWidth ?? canvas?.clientWidth ?? 0,
      height: canvas?.scrollHeight ?? contentHeight,
      gutter: Math.min(72, Math.max(28, (stage?.clientHeight ?? 480) * 0.08)),
    }
  }

  const constrainPan = (candidate: Point, nextScale = scaleRef.current): Point => {
    const { width, gutter } = getStageMetrics()
    if (!width) return candidate
    const scaledWidth = width * nextScale
    const centerX = (width - scaledWidth) / 2
    const freedom = nextScale < 1 ? Math.min(72, width * 0.08) : 40
    const minX = Math.min(centerX - freedom, width - scaledWidth - freedom)
    const maxX = Math.max(centerX + freedom, freedom)
    return { x: Math.min(maxX, Math.max(minX, candidate.x)), y: Math.min(gutter, Math.max(-gutter, candidate.y)) }
  }

  const defaultPan = (nextScale = scaleRef.current): Point => {
    const { width } = getStageMetrics()
    return constrainPan({ x: nextScale < 1 && width ? (width - width * nextScale) / 2 : 0, y: 0 }, nextScale)
  }

  const commitView = (nextScale: number, nextPan: Point, overview = false) => {
    const safeScale = overview ? Math.min(1, Math.max(0.003, nextScale)) : clampScale(nextScale)
    const safePan = constrainPan(nextPan, safeScale)
    scaleRef.current = safeScale
    panRef.current = safePan
    overviewRef.current = overview
    setScale(safeScale)
    setPan(safePan)
    setIsOverview(overview)
  }

  const measureContent = () => { if (canvasRef.current) setContentHeight(canvasRef.current.scrollHeight) }

  useEffect(() => {
    measureContent()
    const canvas = canvasRef.current
    const stage = stageRef.current
    if ((!canvas && !stage) || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      measureContent()
      commitView(scaleRef.current, panRef.current, overviewRef.current)
    })
    if (canvas) observer.observe(canvas)
    if (stage) observer.observe(stage)
    return () => observer.disconnect()
  }, [project.id])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.code === 'Space') spacePressedRef.current = event.type === 'keydown' }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey) }
  }, [])

  useEffect(() => {
    if (!isActive) {
      scaleRef.current = 1
      panRef.current = { x: 0, y: 0 }
      overviewRef.current = false
      setScale(1)
      setPan({ x: 0, y: 0 })
      setIsOverview(false)
      setActiveChapterId(visibleChapters[0]?.id ?? '')
    }
  }, [isActive, project.id])

  useEffect(() => {
    if (!contentViewport || !visibleChapters.length || !isActive) return
    const updateCurrentChapter = () => {
      const viewportTop = contentViewport.getBoundingClientRect().top
      const stickyOffset = readerBarRef.current?.getBoundingClientRect().height ?? 0
      const readingLine = viewportTop + stickyOffset + 20
      let currentId = visibleChapters[0].id
      for (const chapter of visibleChapters) {
        const anchor = articleRef.current?.querySelector<HTMLElement>(`[data-portfolio-anchor="${chapter.id}"]`)
        if (anchor && anchor.getBoundingClientRect().top <= readingLine) currentId = chapter.id
      }
      setActiveChapterId((previous) => previous === currentId ? previous : currentId)
    }
    updateCurrentChapter()
    contentViewport.addEventListener('scroll', updateCurrentChapter, { passive: true })
    return () => contentViewport.removeEventListener('scroll', updateCurrentChapter)
  }, [contentViewport, isActive, project.id])

  useEffect(() => {
    const chapterNav = chapterNavRef.current
    const activeButton = chapterButtonRefs.current[activeChapterId]
    if (!chapterNav || !activeButton) return
    chapterNav.scrollTo({ left: Math.max(0, activeButton.offsetLeft - (chapterNav.clientWidth - activeButton.offsetWidth) / 2), behavior: 'smooth' })
  }, [activeChapterId])

  const preserveReadingPosition = (nextScale: number) => {
    const viewport = contentViewport
    const stage = stageRef.current
    if (!viewport || !stage || scaleRef.current <= 0) return
    const previousScale = scaleRef.current
    const stageTop = stage.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop
    const distance = viewport.scrollTop - stageTop
    requestAnimationFrame(() => {
      const nextStage = stageRef.current
      if (!nextStage) return
      const nextTop = nextStage.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop
      viewport.scrollTop = Math.max(0, nextTop + distance * (nextScale / previousScale))
    })
  }

  const updateScale = (nextScale: number, options: { overview?: boolean; focus?: Point } = {}) => {
    const overview = options.overview ?? false
    const safeScale = overview ? Math.min(1, Math.max(0.003, nextScale)) : clampScale(nextScale)
    const previousScale = scaleRef.current
    const stage = stageRef.current
    let nextPan = defaultPan(safeScale)
    if (options.focus && stage && previousScale > 0) {
      const bounds = stage.getBoundingClientRect()
      const { gutter } = getStageMetrics()
      const pointer = { x: options.focus.x - bounds.left, y: options.focus.y - bounds.top }
      nextPan = {
        x: pointer.x - ((pointer.x - panRef.current.x) * safeScale) / previousScale,
        y: pointer.y - gutter - ((pointer.y - gutter - panRef.current.y) * safeScale) / previousScale,
      }
    }
    preserveReadingPosition(safeScale)
    commitView(safeScale, nextPan, overview)
  }

  const fitWidth = () => { preserveReadingPosition(1); commitView(1, { x: 0, y: 0 }) }
  const centerContent = () => commitView(scaleRef.current, defaultPan(scaleRef.current), overviewRef.current)
  const showOverview = () => {
    const viewport = contentViewport
    const canvas = canvasRef.current
    if (!viewport || !canvas) return
    const availableHeight = Math.max(96, viewport.clientHeight - (readerBarRef.current?.offsetHeight ?? 0) - 32)
    const overviewScale = availableHeight / Math.max(canvas.scrollHeight, 1)
    const { width } = getStageMetrics()
    commitView(overviewScale, { x: width ? (width - width * overviewScale) / 2 : 0, y: 0 }, true)
    requestAnimationFrame(() => {
      const stage = stageRef.current
      if (stage) viewport.scrollTo({ top: stage.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop, behavior: 'auto' })
    })
  }
  const navigateToChapter = (target: string) => {
    setActiveChapterId(target)
    commitView(1, { x: 0, y: 0 })
    // Let the fitted canvas render before calculating the inner reader target.
    requestAnimationFrame(() => requestAnimationFrame(() => onNavigate(target, project.id)))
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    updateScale(scaleRef.current * (event.deltaY < 0 ? 1.12 : 0.89), { focus: { x: event.clientX, y: event.clientY } })
  }
  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, select')) return
    if (!spacePressedRef.current && !target.closest('img') && target !== stageRef.current) return
    dragRef.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, pan: panRef.current }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    event.preventDefault()
  }
  const dragCanvas = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.preventDefault()
    commitView(scaleRef.current, { x: drag.pan.x + event.clientX - drag.start.x, y: drag.pan.y + event.clientY - drag.start.y }, overviewRef.current)
  }
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setIsDragging(false)
  }
  const beginPinch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) pinchRef.current = { distance: touchDistance(event.touches), midpoint: touchMidpoint(event.touches), scale: scaleRef.current, pan: panRef.current }
  }
  const pinchZoom = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchRef.current) return
    event.preventDefault()
    const midpoint = touchMidpoint(event.touches)
    const baseline = pinchRef.current
    const nextScale = clampScale(baseline.scale * (touchDistance(event.touches) / baseline.distance))
    const stage = stageRef.current
    if (!stage) return
    const bounds = stage.getBoundingClientRect()
    const start = { x: baseline.midpoint.x - bounds.left, y: baseline.midpoint.y - bounds.top }
    const current = { x: midpoint.x - bounds.left, y: midpoint.y - bounds.top }
    const { gutter } = getStageMetrics()
    commitView(nextScale, { x: current.x - ((start.x - baseline.pan.x) * nextScale) / baseline.scale, y: current.y - gutter - ((start.y - gutter - baseline.pan.y) * nextScale) / baseline.scale })
  }
  const finishPinch = () => { pinchRef.current = null }
  const { gutter } = getStageMetrics()
  const scaledStageHeight = contentHeight ? Math.max(1, contentHeight * scale + gutter * 2) : undefined

  return <article className="project-window" data-project-id={project.id} data-portfolio-anchor={project.id} ref={articleRef}>
    {project.modules.length > 0 && <nav className="project-window__modules" aria-label={`${project.title} modules`}>
      {project.modules.map((module) => <button type="button" onClick={() => onNavigate(module.target, project.id)} key={module.target}>{module.label}</button>)}
    </nav>}
    {hasReaderControls && <div className="project-window__reader-bar" ref={readerBarRef}>
      <div className="project-window__reader-title"><span>{project.year} · {project.category}</span><h3>{project.title}</h3></div>
      <div className="project-window__reader-actions">
        {visibleChapters.length ? <nav className="project-window__chapters" aria-label={`${project.title} chapters`} ref={chapterNavRef}>
          {visibleChapters.map((chapter) => <button type="button" key={chapter.id} className={activeChapterId === chapter.id ? 'project-window__chapter project-window__chapter--active' : 'project-window__chapter'} aria-current={activeChapterId === chapter.id ? 'location' : undefined} ref={(element) => { chapterButtonRefs.current[chapter.id] = element }} onClick={() => navigateToChapter(chapter.id)}>{chapter.label}</button>)}
        </nav> : <span className="project-window__chapter-spacer" aria-hidden="true" />}
        <div className="project-window__zoom-controls" aria-label={`${project.title} content zoom`}>
          <button type="button" onClick={() => updateScale(scaleRef.current - READING_SCALE_STEP)} aria-label="缩小作品内容">−</button><output aria-live="polite">{Math.round(scale * 100)}%</output><button type="button" onClick={() => updateScale(scaleRef.current + READING_SCALE_STEP)} aria-label="放大作品内容">＋</button>
          <button type="button" className={!isOverview && scale === 1 ? 'is-active' : ''} onClick={fitWidth}>适合宽度</button><button type="button" className={isOverview ? 'is-active' : ''} onClick={showOverview}>整体预览</button><button type="button" onClick={centerContent}>回到居中</button><button type="button" onClick={fitWidth}>重置视图</button>
        </div>
      </div>
    </div>}
    {project.showIntro !== false && <header className="project-window__intro"><p>{project.year} · {project.category}</p><h3>{project.title}</h3><span>{project.subtitle}</span></header>}
    <div className={`project-window__zoom-stage${isOverview ? ' project-window__zoom-stage--overview' : ''}${isDragging ? ' is-dragging' : ''}`} ref={stageRef} style={scaledStageHeight ? { height: `${scaledStageHeight}px` } : undefined} onWheel={handleWheel} onPointerDown={beginDrag} onPointerMove={dragCanvas} onPointerUp={finishDrag} onPointerCancel={finishDrag} onTouchStart={beginPinch} onTouchMove={pinchZoom} onTouchEnd={finishPinch} onTouchCancel={finishPinch}>
      <div className="project-window__zoom-canvas" ref={canvasRef} style={{ transform: `translate3d(${pan.x}px, ${gutter + pan.y}px, 0) scale(${scale})` }}>
        {project.sections.map((section) => <section className="project-window__section" data-portfolio-anchor={section.id} key={section.id}>
          {section.label && <p className="project-window__section-label">{section.label}</p>}
          {section.description && <p className="project-window__section-copy">{section.description}</p>}
          {section.images.map((image) => <img src={image.src} alt={image.alt} draggable={false} key={`${section.id}-${image.src}`} onLoad={() => { measureContent(); onContentResize(project.id) }} />)}
        </section>)}
      </div>
    </div>
  </article>
}
