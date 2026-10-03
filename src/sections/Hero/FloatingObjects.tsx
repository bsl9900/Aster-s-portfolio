import { useEffect, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'
import Matter from 'matter-js'
import { floatingObjects } from './floatingObjects.data'
import './FloatingObjects.css'

type Cursor = { x: number; y: number; nx: number; ny: number; active: boolean }
type PhysicsItem = {
  body: Matter.Body
  constraint: Matter.Constraint
  element: HTMLSpanElement
  home: { x: number; y: number }
  size: number
  config: (typeof floatingObjects)[number]
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const sizeForViewport = (config: (typeof floatingObjects)[number]) => {
  if (window.innerWidth <= 767) return config.size.mobile
  if (window.innerWidth <= 1199) return config.size.tablet
  return config.size.desktop
}

export function FloatingObjects({ cursor }: { cursor: RefObject<Cursor> }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLSpanElement>())

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const engine = Matter.Engine.create({ enableSleeping: false })
    engine.gravity.x = 0
    engine.gravity.y = 0
    engine.gravity.scale = 0.001
    let items: PhysicsItem[] = []
    let animationFrame = 0
    let lastTime = performance.now()
    let lastCursor = { x: cursor.current.x, y: cursor.current.y }

    const rebuild = () => {
      Matter.Composite.clear(engine.world, false)
      const rect = root.getBoundingClientRect()
      items = floatingObjects.flatMap((config) => {
        const element = itemRefs.current.get(config.id)
        if (!element) return []
        const size = sizeForViewport(config)
        const home = { x: rect.width * config.x / 100, y: rect.height * config.y / 100 }
        const body = Matter.Bodies.circle(home.x, home.y, size * 0.42, {
          frictionAir: config.damping,
          friction: 0,
          restitution: 0.18,
        })
        Matter.Body.setMass(body, config.mass)
        const constraint = Matter.Constraint.create({
          bodyA: body,
          pointB: { ...home },
          length: 0,
          stiffness: config.spring,
          damping: config.damping * 0.65,
        })
        Matter.Composite.add(engine.world, [body, constraint])
        return [{ body, constraint, element, home, size, config }]
      })
    }

    const resizeObserver = new ResizeObserver(rebuild)
    resizeObserver.observe(root)
    rebuild()

    const applySafeZoneForce = (item: PhysicsItem, rootRect: DOMRect, titleRect: DOMRect | undefined) => {
      if (!titleRect) return
      const padding = window.innerWidth <= 767 ? 72 : 132
      const left = titleRect.left - rootRect.left - padding
      const right = titleRect.right - rootRect.left + padding
      const top = titleRect.top - rootRect.top - padding
      const bottom = titleRect.bottom - rootRect.top + padding
      const { x, y } = item.body.position
      if (x < left || x > right || y < top || y > bottom) return
      const nearestX = clamp(x, left, right)
      const nearestY = clamp(y, top, bottom)
      let dx = x - nearestX
      let dy = y - nearestY
      if (dx === 0 && dy === 0) {
        dx = x - (left + right) / 2
        dy = y - (top + bottom) / 2
      }
      const distance = Math.max(1, Math.hypot(dx, dy))
      const force = 0.00135 / item.config.mass
      Matter.Body.applyForce(item.body, item.body.position, { x: dx / distance * force, y: dy / distance * force })
    }

    const applyCursorImpulse = (item: PhysicsItem, rootRect: DOMRect, dx: number, dy: number, speed: number) => {
      const pointer = cursor.current
      if (!pointer.active) return
      const px = pointer.x - rootRect.left
      const py = pointer.y - rootRect.top
      const distance = Math.hypot(item.body.position.x - px, item.body.position.y - py)
      const reach = clamp(item.size * 2.4, 155, 245)
      if (distance >= reach) return
      const influence = (1 - distance / reach) ** 2
      const radialX = (item.body.position.x - px) / Math.max(distance, 1)
      const radialY = (item.body.position.y - py) / Math.max(distance, 1)
      const moveLength = Math.max(1, Math.hypot(dx, dy))
      const travelX = dx / moveLength
      const travelY = dy / moveLength
      const strength = (0.00042 + speed * 0.0017) * influence * item.config.depth / item.config.mass
      Matter.Body.applyForce(item.body, item.body.position, {
        x: (radialX * 0.68 + travelX * 0.32) * strength,
        y: (radialY * 0.68 + travelY * 0.32) * strength,
      })
    }

    const update = (now: number) => {
      animationFrame = requestAnimationFrame(update)
      const rootRect = root.getBoundingClientRect()
      if (!rootRect.width || !rootRect.height) return
      const delta = clamp(now - lastTime, 8, 33)
      lastTime = now
      const current = cursor.current
      const dx = current.x - lastCursor.x
      const dy = current.y - lastCursor.y
      const moved = current.active && (Math.abs(dx) + Math.abs(dy) > 0.1)
      const speed = moved ? clamp(Math.hypot(dx, dy) / delta, 0, 1.6) : 0
      const title = document.getElementById('hero-title')?.getBoundingClientRect()

      for (const item of items) {
        const idleY = Math.sin(now / 1000 * (Math.PI * 2 / item.config.idle.duration) + item.config.idle.phase) * item.config.idle.amplitude
        item.constraint.pointB.x = item.home.x
        item.constraint.pointB.y = item.home.y + idleY
        Matter.Body.applyForce(item.body, item.body.position, { x: 0, y: item.config.gravityScale * item.config.mass * 0.00018 })
        if (moved) applyCursorImpulse(item, rootRect, dx, dy, speed)
        applySafeZoneForce(item, rootRect, title)
      }

      Matter.Engine.update(engine, delta)
      for (const item of items) {
        const x = item.body.position.x - item.size / 2
        const y = item.body.position.y - item.size / 2
        item.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${item.body.angle * 0.12}rad)`
      }
      lastCursor = { x: current.x, y: current.y }
    }

    animationFrame = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [cursor])

  return <div ref={rootRef} className="hero-floating" aria-hidden="true">
    {floatingObjects.map((item) => <span
      key={item.id}
      ref={(element) => { if (element) itemRefs.current.set(item.id, element); else itemRefs.current.delete(item.id) }}
      className="hero-floating__item"
      style={{
        '--floating-size-desktop': `${item.size.desktop}px`,
        '--floating-size-tablet': `${item.size.tablet}px`,
        '--floating-size-mobile': `${item.size.mobile}px`,
      } as CSSProperties}
    ><img className="hero-floating__image" src={item.src} alt="" draggable={false} /></span>)}
  </div>
}
