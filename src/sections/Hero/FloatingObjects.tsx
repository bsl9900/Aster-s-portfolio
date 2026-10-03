import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import Matter from 'matter-js'
import { floatingObjects } from './floatingObjects.data'
import './FloatingObjects.css'

type Cursor = { x: number; y: number; nx: number; ny: number; active: boolean }
type PhysicsItem = {
  body: Matter.Body
  element: HTMLSpanElement
  width: number
  height: number
  config: (typeof floatingObjects)[number]
}

const FLOATING_CATEGORY = 0x0002
const BOUNDARY_CATEGORY = 0x0004
const COLLIDER_SCALE_X = 1
const COLLIDER_SCALE_Y = 1
const DRAG_STIFFNESS = 0.22
const DRAG_DAMPING = 0.14
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const heightForViewport = (config: (typeof floatingObjects)[number]) => {
  if (window.innerWidth <= 767) return config.height.mobile
  if (window.innerWidth <= 1199) return config.height.tablet
  return config.height.desktop
}

export function FloatingObjects({ cursor }: { cursor: RefObject<Cursor> }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLSpanElement>())
  const [heldId, setHeldId] = useState<string | null>(null)
  const [gravityStatus, setGravityStatus] = useState<'hidden' | 'ready' | 'enabled' | 'denied'>('hidden')
  const enableGravityRef = useRef<() => void>(() => {})

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const engine = Matter.Engine.create({ enableSleeping: false })
    engine.gravity.x = 0
    engine.gravity.y = 0.62
    engine.gravity.scale = 0.001
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const mouse = Matter.Mouse.create(root)
    // Pointer Events own input. Matter's compatibility touch handlers otherwise
    // grab immediately and prevent the blank-background scene swipe.
    const mouseHandlers = mouse as Matter.Mouse & Record<string, EventListener>
    for (const [type, handler] of [
      ['mousemove', 'mousemove'], ['mousedown', 'mousedown'], ['mouseup', 'mouseup'],
      ['wheel', 'mousewheel'], ['touchmove', 'mousemove'],
      ['touchstart', 'mousedown'], ['touchend', 'mouseup'],
    ]) root.removeEventListener(type, mouseHandlers[handler])
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      collisionFilter: { category: FLOATING_CATEGORY, mask: FLOATING_CATEGORY },
      constraint: { stiffness: DRAG_STIFFNESS, damping: DRAG_DAMPING, render: { visible: false } },
    })
    Matter.Composite.add(engine.world, mouseConstraint)

    // Matter's built-in Mouse listener is mouse-event based. Keep it in sync with
    // Pointer Events as well, so pen/touch input and browsers that suppress a
    // compatibility mouse event still drive the same constraint.
    let longPressTimer = 0
    let activePointerId: number | null = null
    let touchStart = { x: 0, y: 0 }
    let floatingGestureActive = false
    let sensorAttached = false
    let targetGravity = { x: 0, y: 0.62 }
    let previousAcceleration = 0
    let lastShakeAt = 0
    const setMousePosition = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const x = (event.clientX - rect.left) * root.clientWidth / Math.max(1, rect.width)
      const y = (event.clientY - rect.top) * root.clientHeight / Math.max(1, rect.height)
      mouse.position.x = x
      mouse.position.y = y
      mouse.absolute.x = x
      mouse.absolute.y = y
    }
    const beginGrab = (event: PointerEvent) => {
      setMousePosition(event)
      mouse.button = 0
      mouse.mousedownPosition.x = mouse.position.x
      mouse.mousedownPosition.y = mouse.position.y
    }
    const onPointerDown = (event: PointerEvent) => {
      setMousePosition(event)
      const startsOnFloatingObject = event.target instanceof Element
        && Boolean(event.target.closest('.hero-floating__item'))
      if (event.pointerType === 'touch' && !startsOnFloatingObject) return
      activePointerId = event.pointerId
      if (event.pointerType === 'touch') {
        floatingGestureActive = true
        window.dispatchEvent(new CustomEvent('portfolio:computer-gesture', { detail: { active: true } }))
        touchStart = { x: event.clientX, y: event.clientY }
        longPressTimer = window.setTimeout(() => beginGrab(event), 280)
        root.setPointerCapture?.(event.pointerId)
        return
      }
      beginGrab(event)
      root.setPointerCapture?.(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      setMousePosition(event)
      // A normal upward swipe remains a scene-navigation gesture. Only a
      // stationary press can become a physics grab on touch devices.
      if (event.pointerType === 'touch' && longPressTimer
        && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10) {
        window.clearTimeout(longPressTimer)
        longPressTimer = 0
      }
    }
    const endPointer = (event: PointerEvent) => {
      if (longPressTimer) window.clearTimeout(longPressTimer)
      longPressTimer = 0
      if (activePointerId === event.pointerId) {
        mouse.button = -1
        activePointerId = null
      }
      if (floatingGestureActive) {
        floatingGestureActive = false
        window.dispatchEvent(new CustomEvent('portfolio:computer-gesture', { detail: { active: false } }))
      }
      if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId)
    }
    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerup', endPointer)
    root.addEventListener('pointercancel', endPointer)

    let disposed = false
    let items: PhysicsItem[] = []
    let animationFrame = 0
    let resizeFrame = 0
    let lastTime = performance.now()
    let lastCursor = { x: cursor.current.x, y: cursor.current.y }
    let heldBody: Matter.Body | null = null
    let releaseVelocity = { x: 0, y: 0 }
    let lastDragSample = { x: 0, y: 0, time: performance.now() }

    const bodyItem = (body: Matter.Body) => items.find((item) => item.body === body)

    const rebuild = () => {
      const rect = root.getBoundingClientRect()
      // A hidden/settling mobile Hero can briefly report a zero layout box.
      // Never create dynamic bodies at (0, 0); wait for its first real layout.
      if (rect.width < 2 || rect.height < 2) return
      rect.width = root.clientWidth
      rect.height = root.clientHeight
      mouse.button = -1
      mouseConstraint.constraint.bodyB = null
      ;(mouseConstraint as unknown as { body: Matter.Body | null }).body = null
      heldBody = null
      Matter.Composite.clear(engine.world, false)
      Matter.Composite.add(engine.world, mouseConstraint)
      const wall = Math.max(64, Math.round(Math.min(rect.width, rect.height) * 0.08))
      const floorTop = rect.height * (window.innerWidth <= 767 ? 0.92 : 0.89)
      const staticBodies = [
        ...(isMobile ? [Matter.Bodies.rectangle(rect.width / 2, -wall / 2, rect.width + wall * 2, wall, { isStatic: true, friction: 0.18, restitution: 0.34, collisionFilter: { category: BOUNDARY_CATEGORY, mask: FLOATING_CATEGORY } })] : []),
        Matter.Bodies.rectangle(-wall / 2, rect.height / 2, wall, rect.height + wall * 2, { isStatic: true, friction: 0.1, restitution: 0.42, collisionFilter: { category: BOUNDARY_CATEGORY, mask: FLOATING_CATEGORY } }),
        Matter.Bodies.rectangle(rect.width + wall / 2, rect.height / 2, wall, rect.height + wall * 2, { isStatic: true, friction: 0.1, restitution: 0.42, collisionFilter: { category: BOUNDARY_CATEGORY, mask: FLOATING_CATEGORY } }),
        Matter.Bodies.rectangle(rect.width / 2, floorTop + wall / 2, rect.width + wall * 2, wall, { isStatic: true, friction: 0.18, restitution: 0.34, collisionFilter: { category: BOUNDARY_CATEGORY, mask: FLOATING_CATEGORY } }),
      ]
      Matter.Composite.add(engine.world, staticBodies)
      items = floatingObjects.flatMap((config, index) => {
        const element = itemRefs.current.get(config.id)
        if (!element) return []
        const height = heightForViewport(config)
        const width = height * config.aspectRatio
        const startX = clamp(rect.width * config.start.x / 100, width / 2, rect.width - width / 2)
        const startY = clamp(rect.height * config.start.y / 100, height / 2 + 8, floorTop - height / 2)
        const body = Matter.Bodies.rectangle(startX, startY, width * COLLIDER_SCALE_X, height * COLLIDER_SCALE_Y, {
          label: 'hero-floating',
          frictionAir: config.frictionAir,
          friction: 0.075,
          restitution: config.restitution,
          density: 0.001,
          collisionFilter: { category: FLOATING_CATEGORY, mask: FLOATING_CATEGORY | BOUNDARY_CATEGORY },
        })
        Matter.Body.setMass(body, config.mass)
        Matter.Body.setAngularVelocity(body, ((index % 3) - 1) * 0.01)
        Matter.Composite.add(engine.world, body)
        return [{ body, element, width, height, config }]
      })
    }

    const requestRebuild = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(rebuild)
    }

    const onStartDrag = (event: Matter.IEvent<Matter.MouseConstraint>) => {
      const body = (event as Matter.IEvent<Matter.MouseConstraint> & { body: Matter.Body }).body
      if (body.label !== 'hero-floating') return
      heldBody = body
      const item = bodyItem(body)
      setHeldId(item?.config.id ?? null)
      lastDragSample = { x: mouse.position.x, y: mouse.position.y, time: performance.now() }
      releaseVelocity = { x: 0, y: 0 }
    }

    const onEndDrag = (event: Matter.IEvent<Matter.MouseConstraint>) => {
      const body = (event as Matter.IEvent<Matter.MouseConstraint> & { body: Matter.Body }).body
      if (body === heldBody) Matter.Body.setVelocity(body, releaseVelocity)
      heldBody = null
      setHeldId(null)
    }

    Matter.Events.on(mouseConstraint, 'startdrag', onStartDrag)
    Matter.Events.on(mouseConstraint, 'enddrag', onEndDrag)

    const resizeObserver = new ResizeObserver(requestRebuild)
    resizeObserver.observe(root)
    window.addEventListener('resize', requestRebuild)
    requestRebuild()

    const applyCursorImpulse = (item: PhysicsItem, rootRect: DOMRect, dx: number, dy: number, speed: number) => {
      const pointer = cursor.current
      if (!pointer.active || item.body === heldBody) return
      const px = (pointer.x - rootRect.left) * root.clientWidth / Math.max(1, rootRect.width)
      const py = (pointer.y - rootRect.top) * root.clientHeight / Math.max(1, rootRect.height)
      const distance = Math.hypot(item.body.position.x - px, item.body.position.y - py)
      const reach = clamp(Math.max(item.width, item.height) * 1.5, 145, 260)
      if (distance >= reach) return
      const influence = (1 - distance / reach) ** 2
      const radialX = (item.body.position.x - px) / Math.max(distance, 1)
      const radialY = (item.body.position.y - py) / Math.max(distance, 1)
      const motionLength = Math.max(1, Math.hypot(dx, dy))
      const travelX = dx / motionLength
      const travelY = dy / motionLength
      const strength = (0.0024 + speed * 0.012) * influence / item.config.mass
      Matter.Body.applyForce(item.body, item.body.position, {
        x: (radialX * 0.76 + travelX * 0.24) * strength,
        y: (radialY * 0.76 + travelY * 0.24) * strength,
      })
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return
      const gamma = event.gamma * Math.PI / 180
      const beta = event.beta * Math.PI / 180
      const angle = (screen.orientation?.angle ?? 0) * Math.PI / 180
      const x = Math.sin(gamma) * Math.cos(beta)
      const y = Math.sin(beta)
      targetGravity = {
        x: clamp((x * Math.cos(angle) + y * Math.sin(angle)) * 0.8, -0.8, 0.8),
        y: clamp((y * Math.cos(angle) - x * Math.sin(angle)) * 0.8, -0.8, 0.8),
      }
    }
    const onMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration) return
      const magnitude = Math.hypot(acceleration.x ?? 0, acceleration.y ?? 0, acceleration.z ?? 0)
      if (!previousAcceleration) { previousAcceleration = magnitude; return }
      const change = Math.abs(magnitude - previousAcceleration)
      previousAcceleration = magnitude
      const now = performance.now()
      if (change < 7.5 || now - lastShakeAt < 450) return
      lastShakeAt = now
      const impulse = clamp((change - 7.5) * 0.00018, 0.00035, 0.0014)
      for (const item of items) {
        const direction = item.body.position.x < root.clientWidth / 2 ? -1 : 1
        Matter.Body.applyForce(item.body, item.body.position, {
          x: direction * impulse * 0.55 / item.config.mass,
          y: -impulse / item.config.mass,
        })
      }
    }
    const attachSensors = () => {
      if (!isMobile || sensorAttached || disposed) return
      sensorAttached = true
      window.addEventListener('deviceorientation', onOrientation)
      window.addEventListener('devicemotion', onMotion)
      setGravityStatus('enabled')
    }
    const detachSensors = () => {
      if (!sensorAttached) return
      sensorAttached = false
      window.removeEventListener('deviceorientation', onOrientation)
      window.removeEventListener('devicemotion', onMotion)
    }
    const requestGravityAccess = async () => {
      const Orientation = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<PermissionState> }
      const Motion = window.DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<PermissionState> }
      if (!Orientation || !window.isSecureContext) { setGravityStatus('denied'); return }
      try {
        const permissions = await Promise.all([
          Orientation.requestPermission?.() ?? Promise.resolve('granted' as PermissionState),
          Motion?.requestPermission?.() ?? Promise.resolve('granted' as PermissionState),
        ])
        if (permissions.every((permission) => permission === 'granted')) attachSensors()
        else setGravityStatus('denied')
      } catch {
        setGravityStatus('denied')
      }
    }
    enableGravityRef.current = requestGravityAccess
    if (isMobile) {
      setGravityStatus('ready')
    }

    const update = (now: number) => {
      animationFrame = requestAnimationFrame(update)
      const rootRect = root.getBoundingClientRect()
      if (!rootRect.width || !rootRect.height) return
      const delta = clamp(now - lastTime, 8, 16.667)
      lastTime = now
      const current = cursor.current
      const dx = current.x - lastCursor.x
      const dy = current.y - lastCursor.y
      const moved = current.active && Math.abs(dx) + Math.abs(dy) > 0.1
      const speed = moved ? clamp(Math.hypot(dx, dy) / delta, 0, 1.7) : 0

      engine.gravity.x += (targetGravity.x - engine.gravity.x) * 0.08
      engine.gravity.y += (targetGravity.y - engine.gravity.y) * 0.08

      if (heldBody) {
        const elapsed = Math.max(8, now - lastDragSample.time)
        releaseVelocity = {
          x: clamp((mouse.position.x - lastDragSample.x) / elapsed * 16.67, -16, 16),
          y: clamp((mouse.position.y - lastDragSample.y) / elapsed * 16.67, -16, 16),
        }
        lastDragSample = { x: mouse.position.x, y: mouse.position.y, time: now }
      }
      for (const item of items) if (moved) applyCursorImpulse(item, rootRect, dx, dy, speed)
      Matter.Engine.update(engine, delta)
      for (const item of items) {
        const x = item.body.position.x - item.width / 2
        const y = item.body.position.y - item.height / 2
        item.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${item.body.angle}rad)`
      }
      lastCursor = { x: current.x, y: current.y }
    }

    animationFrame = requestAnimationFrame(update)
    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      cancelAnimationFrame(resizeFrame)
      if (longPressTimer) window.clearTimeout(longPressTimer)
      detachSensors()
      if (floatingGestureActive) window.dispatchEvent(new CustomEvent('portfolio:computer-gesture', { detail: { active: false } }))
      enableGravityRef.current = () => {}
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', endPointer)
      root.removeEventListener('pointercancel', endPointer)
      resizeObserver.disconnect()
      window.removeEventListener('resize', requestRebuild)
      Matter.Events.off(mouseConstraint, 'startdrag', onStartDrag)
      Matter.Events.off(mouseConstraint, 'enddrag', onEndDrag)
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [cursor])

  return <div ref={rootRef} className="hero-floating">
    {floatingObjects.map((item) => <span
      key={item.id}
      aria-hidden="true"
      ref={(element) => { if (element) itemRefs.current.set(item.id, element); else itemRefs.current.delete(item.id) }}
      className={`hero-floating__item${heldId === item.id ? ' hero-floating__item--held' : ''}`}
      style={{
        '--floating-size-desktop': `${item.height.desktop * item.aspectRatio}px`,
        '--floating-size-tablet': `${item.height.tablet * item.aspectRatio}px`,
        '--floating-size-mobile': `${item.height.mobile * item.aspectRatio}px`,
      } as CSSProperties}
    ><img className="hero-floating__image" src={item.src} alt="" draggable={false} /></span>)}
    {gravityStatus !== 'hidden' && <button
      type="button"
      className="hero-floating__gravity-control"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => enableGravityRef.current()}
      disabled={gravityStatus === 'enabled' || gravityStatus === 'denied'}
    >{gravityStatus === 'enabled' ? '重力感应已启用' : gravityStatus === 'denied' ? '重力感应需 HTTPS / 授权' : '启用重力感应'}</button>}
  </div>
}
