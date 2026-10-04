import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Matter from 'matter-js'
import { contactObjects, type ContactAction } from './contact.data'
import { clamp, contactSizes, contactSpawns, contactTargets, randomBetween, type ContactPoint, type ContactSize } from './contact.physics'

type Reaction = { id: number; text: string; x: number; y: number; dx: number; dy: number; rotation: number; scale: number; duration: number }
type Props = { active: boolean; paused: boolean; onOpen: (action: Exclude<ContactAction, 'reaction'>) => void }
type FloatingBody = ContactSize & {
  body: Matter.Body
  node: HTMLButtonElement
  target: ContactPoint
  wander: ContactPoint
  nextWander: number
  liftStarted: number | null
  floatInertia: number
  floatRadiusX: number
  floatRadiusY: number
  angularTarget: number
}
type Phase = 'drop' | 'lift' | 'float'
type DisturbanceSource = 'mobile-pull' | 'desktop-wheel' | 'desktop-blank'

export function ContactObjects({ active, paused, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([])
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const timers = useRef(new Set<number>())
  const sequence = useRef(0)
  const hintShown = useRef(false)
  const [hint, setHint] = useState(false)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!active || !rootRef.current) return
    const root = rootRef.current
    const engine = Matter.Engine.create({ enableSleeping: false, positionIterations: 10, velocityIterations: 8 })
    let frame = 0, previous = 0, elapsed = 0, phaseStartedAt = 0
    let phase: Phase = 'drop'
    let bodies: FloatingBody[] = []
    let lastSize = '', width = 0, height = 0, safeTop = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const section = root.parentElement
    const reshuffleCooldown = 720
    let lastReshuffleAt = -Infinity
    let wheelIntent = 0
    let wheelResetTimer: number | null = null
    let touchStart: { x: number; y: number } | null = null
    let touchLast: { x: number; y: number } | null = null
    let mouseStart: { x: number; y: number } | null = null

    const disturb = (source: DisturbanceSource, gesture = { x: 0, y: 0 }, originX?: number) => {
      const now = performance.now()
      if (phase !== 'float' || reduced || pausedRef.current || now - lastReshuffleAt < reshuffleCooldown) return false
      lastReshuffleAt = now
      root.dataset.lastReshuffle = source
      root.dataset.reshuffleCount = String(Number(root.dataset.reshuffleCount || 0) + 1)

      for (const item of bodies) {
        const { body } = item
        Matter.Sleeping.set(body, false)
        let impulseX = randomBetween(-0.9, 0.9)
        let impulseY = randomBetween(-1.3, -0.6)

        if (source === 'mobile-pull') {
          const pull = clamp(Math.hypot(gesture.x, gesture.y) / 150, 0.55, 1.35)
          const sidewaysReaction = clamp(-gesture.x / 180, -0.7, 0.7)
          impulseX = sidewaysReaction + randomBetween(-1.15, 1.15) * pull
          // Pulling the page down produces the stronger balloon-like upward kick.
          const upwardBase = gesture.y > 0 ? -2.35 : -1.45
          impulseY = upwardBase * pull + randomBetween(-0.55, 0.35)
        } else if (source === 'desktop-wheel') {
          impulseX = randomBetween(-0.85, 0.85)
          impulseY = (gesture.y > 0 ? randomBetween(-1.75, -0.85) : randomBetween(0.35, 1.05))
        } else if (originX !== undefined) {
          const away = Math.sign(body.position.x - originX) || (Math.random() < 0.5 ? -1 : 1)
          impulseX = away * randomBetween(0.35, 0.85) + randomBetween(-0.45, 0.45)
          impulseY = randomBetween(-1.4, -0.55)
        }

        Matter.Body.setVelocity(body, {
          x: clamp(body.velocity.x + impulseX, -3, 3),
          y: clamp(body.velocity.y + impulseY, -3.8, 3.8),
        })
        Matter.Body.setAngularVelocity(body, clamp(body.angularVelocity + randomBetween(-0.018, 0.018), -0.055, 0.055))
        item.nextWander = elapsed + randomBetween(900, 1800)
      }
      return true
    }

    const onTouchStart = (event: TouchEvent) => {
      if (!coarsePointer || event.touches.length !== 1) return
      const touch = event.touches[0]
      touchStart = { x: touch.clientX, y: touch.clientY }
      touchLast = touchStart
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!touchStart || event.touches.length !== 1) return
      const touch = event.touches[0]
      touchLast = { x: touch.clientX, y: touch.clientY }
    }
    const finishTouch = (event: TouchEvent) => {
      if (!touchStart) return
      const touch = event.changedTouches[0]
      const end = touch ? { x: touch.clientX, y: touch.clientY } : touchLast ?? touchStart
      const gesture = { x: end.x - touchStart.x, y: end.y - touchStart.y }
      touchStart = null; touchLast = null
      if (Math.hypot(gesture.x, gesture.y) >= 48 && Math.max(Math.abs(gesture.y), Math.abs(gesture.x) * 0.75) >= 36) {
        disturb('mobile-pull', gesture)
      }
    }
    const onWheel = (event: WheelEvent) => {
      if (coarsePointer) return
      wheelIntent += event.deltaY
      if (wheelResetTimer !== null) window.clearTimeout(wheelResetTimer)
      wheelResetTimer = window.setTimeout(() => { wheelIntent = 0; wheelResetTimer = null }, 170)
      if (Math.abs(wheelIntent) >= 90) {
        const direction = Math.sign(wheelIntent)
        wheelIntent = 0
        disturb('desktop-wheel', { x: 0, y: direction })
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!coarsePointer && event.pointerType === 'mouse' && event.button === 0) mouseStart = { x: event.clientX, y: event.clientY }
    }
    const onPointerUp = (event: PointerEvent) => {
      if (coarsePointer || event.pointerType !== 'mouse' || event.button !== 0 || !mouseStart) return
      const moved = Math.hypot(event.clientX - mouseStart.x, event.clientY - mouseStart.y)
      mouseStart = null
      if (moved > 8) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('button, a, input, select, textarea, video, [role="button"]')) return
      const protectedNodes = section?.querySelectorAll<HTMLElement>('.contact-section__greeting, .contact-section__qr-button, .contact-section__plant, .contact-section__statement, .contact-section__signature') ?? []
      const overVisibleElement = Array.from(protectedNodes).some(node => {
        const rect = node.getBoundingClientRect()
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
      })
      if (overVisibleElement) return
      const box = root.getBoundingClientRect()
      const factor = root.clientWidth / box.width
      disturb('desktop-blank', { x: 0, y: 0 }, (event.clientX - box.left) * factor)
    }

    section?.addEventListener?.('touchstart', onTouchStart, { passive: true })
    section?.addEventListener?.('touchmove', onTouchMove, { passive: true })
    section?.addEventListener?.('touchend', finishTouch, { passive: true })
    section?.addEventListener?.('touchcancel', finishTouch, { passive: true })
    section?.addEventListener?.('wheel', onWheel, { passive: true })
    section?.addEventListener?.('pointerdown', onPointerDown, { passive: true })
    section?.addEventListener?.('pointerup', onPointerUp, { passive: true })
    const setPhase = (next: Phase) => {
      if (phase !== next) phaseStartedAt = elapsed
      phase = next; root.dataset.phase = next
      if (next === 'float' && !reduced) {
        for (const item of bodies) {
          // A crowded mobile layout can pin one late body against another during lift.
          // FLOAT must still take ownership of every body once the group is settled.
          if (item.liftStarted === null) item.liftStarted = elapsed
          Matter.Body.setInertia(item.body, item.floatInertia)
          item.body.frictionAir = 0.018
          item.body.restitution = 0.1
          item.body.friction = 0.14
          item.angularTarget = randomBetween(-0.035, 0.035)
        }
      }
    }
    if (!hintShown.current) {
      const showTimer = window.setTimeout(() => {
        hintShown.current = true
        setHint(true)
        timers.current.delete(showTimer)
        const hideTimer = window.setTimeout(() => {
          setHint(false)
          timers.current.delete(hideTimer)
        }, 2000)
        timers.current.add(hideTimer)
      }, 1000)
      timers.current.add(showTimer)
    }
    const layout = () => {
      // Scroll-lock can temporarily remove the page scrollbar; it must not restart the scene.
      if (pausedRef.current) return
      width = root.clientWidth; height = root.clientHeight
      const fixed = root.parentElement?.querySelector<HTMLElement>('.contact-section__fixed')
      const measuredSafeTop = fixed ? fixed.offsetTop + fixed.offsetHeight + 24 : height * 0.33
      if (!width || !height || lastSize === `${width}:${height}:${measuredSafeTop}`) return
      lastSize = `${width}:${height}:${measuredSafeTop}`; safeTop = measuredSafeTop
      root.style.setProperty('--contact-safe-top', `${safeTop}px`)
      Matter.Composite.clear(engine.world, false); Matter.Engine.clear(engine)
      const wall = 160
      const boundary = { isStatic: true, friction: 0.5, restitution: 0.12 }
      Matter.Composite.add(engine.world, [
        Matter.Bodies.rectangle(width / 2, height - 44 + wall / 2, width + wall * 2, wall, boundary),
        Matter.Bodies.rectangle(-wall / 2, height / 2 - 1000, wall, height * 4 + 3000, boundary),
        Matter.Bodies.rectangle(width + wall / 2, height / 2 - 1000, wall, height * 4 + 3000, boundary),
        Matter.Bodies.rectangle(width / 2, safeTop - wall / 2, width + wall * 2, wall, { ...boundary, collisionFilter: { category: 2 } }),
      ])
      const sizes = contactSizes(contactObjects, width, height)
      const targets = contactTargets(sizes, width, height, safeTop)
      const spawns = contactSpawns(sizes, width, targets)
      bodies = contactObjects.flatMap((_, i) => {
        const node = itemsRef.current[i]
        if (!node) return []
        const size = sizes[i], point = reduced ? targets[i] : spawns[i]
        const body = Matter.Bodies.rectangle(point.x, point.y, size.collisionWidth, size.collisionHeight, {
          restitution: reduced ? 0 : 0.24, friction: 0.5, frictionAir: 0.024,
          collisionFilter: { category: 1, mask: reduced ? 3 : 1 },
        })
        const floatInertia = body.inertia
        // Matter owns the outer transform; only the inner span breathes.
        Matter.Body.setInertia(body, Infinity)
        if (!reduced) Matter.Body.setVelocity(body, { x: randomBetween(-0.18, 0.18), y: randomBetween(0, 0.45) })
        node.style.width = `${size.width}px`; node.style.height = `${size.height}px`
        node.style.transform = `translate3d(${point.x - size.width / 2}px, ${point.y - size.height / 2}px, 0)`
        node.style.setProperty('--breath-duration', `${randomBetween(4, 7).toFixed(2)}s`)
        node.style.setProperty('--breath-delay', `${-randomBetween(0, 7).toFixed(2)}s`)
        Matter.Composite.add(engine.world, body)
        return [{
          ...size, body, node, target: targets[i], wander: targets[i], nextWander: randomBetween(1500, 3500),
          liftStarted: reduced ? 0 : null, floatInertia, floatRadiusX: randomBetween(25, 60),
          floatRadiusY: randomBetween(20, 45), angularTarget: 0,
        }]
      })
      elapsed = 0
      engine.gravity.y = reduced ? 0 : 0.85
      setPhase(reduced ? 'float' : 'drop')
      root.dataset.ready = 'true'
    }
    const tick = (time: number) => {
      if (!pausedRef.current && !document.hidden) {
        const delta = previous ? Math.min(time - previous, 1000 / 30) : 1000 / 60
        elapsed += delta
        for (const item of bodies) {
          // Each icon catches buoyancy on entering the middle band; never wait for the floor or its peers.
          const liftLine = Math.max(safeTop + item.collisionHeight / 2 + 12, Math.min(item.target.y, height * 0.55))
          if (item.liftStarted === null && item.body.position.y >= liftLine) {
            item.liftStarted = elapsed
            if (phase === 'drop') setPhase('lift')
          }
        }
        if (phase !== 'drop') {
          engine.gravity.y = phase === 'lift' ? 0.85 : 0
          for (const item of bodies) {
            if (item.liftStarted === null) continue
            const { body, target } = item
            body.frictionAir = phase === 'float' ? 0.018 : 0.075
            if (phase === 'float' && !reduced && elapsed >= item.nextWander) {
              item.nextWander = elapsed + randomBetween(1500, 3500)
              item.wander = {
                x: clamp(target.x + randomBetween(-item.floatRadiusX, item.floatRadiusX), item.collisionWidth / 2 + 6, width - item.collisionWidth / 2 - 6),
                y: clamp(target.y + randomBetween(-item.floatRadiusY, item.floatRadiusY), safeTop + item.collisionHeight / 2 + 6, height - 50 - item.collisionHeight / 2),
              }
              item.angularTarget = randomBetween(-0.04, 0.04)
            }
            const focus = phase === 'float' ? item.wander : target
            const gain = phase === 'lift' ? 0.000012 : 0.0000024
            const mix = phase === 'lift' ? Math.min(1, (elapsed - item.liftStarted + delta) / 220) : 1
            const maxForce = phase === 'lift' ? 0.0015 : 0.00012
            const damping = phase === 'lift' ? 0.0007 : 0.000035
            const centerX = clamp((target.x - body.position.x) * 0.00000035, -0.000035, 0.000035)
            const centerY = clamp((target.y - body.position.y) * 0.00000035, -0.000035, 0.000035)
            // Damped attraction, never teleport a live body or invert gravity.
            Matter.Body.applyForce(body, body.position, {
              x: body.mass * clamp((focus.x - body.position.x) * gain + (phase === 'float' ? centerX : 0) - body.velocity.x * damping, -maxForce, maxForce) * mix,
              y: body.mass * (clamp((focus.y - body.position.y) * gain + (phase === 'float' ? centerY : 0) - body.velocity.y * damping, -maxForce, maxForce) - engine.gravity.y * engine.gravity.scale) * mix,
            })
            if (phase === 'float' && !reduced) {
              const angleError = item.angularTarget - body.angle
              body.torque += body.inertia * (angleError * 0.0000008 - body.angularVelocity * 0.00002)
            }
          }
          const nearTargets = bodies.every(item => Math.hypot(item.body.position.x - item.target.x, item.body.position.y - item.target.y) < 32)
          const inFloatingRegion = bodies.every(item => item.body.bounds.min.y >= safeTop && item.body.position.y < height * 0.87)
          const settledInRegion = inFloatingRegion && bodies.every(item => item.body.speed < 0.35)
          // Contacts can keep a body slightly off its exact target. Do not wait forever on a pixel-perfect equilibrium.
          const allLifting = bodies.every(item => item.liftStarted !== null)
          const liftAge = elapsed - Math.max(...bodies.map(item => item.liftStarted ?? elapsed))
          const liftPhaseAge = elapsed - phaseStartedAt
          if (phase === 'lift' && (
            (allLifting && liftAge > 500 && nearTargets)
            || (liftPhaseAge > 900 && settledInRegion)
            || liftPhaseAge > 6000
          )) setPhase('float')
        }
        Matter.Engine.update(engine, delta)
        for (const { body, node, width: w, height: h } of bodies) {
          if (body.bounds.min.y > safeTop + 4) body.collisionFilter.mask = 3
          node.style.transform = `translate3d(${body.position.x - w / 2}px, ${body.position.y - h / 2}px, 0) rotate(${body.angle}rad)`
        }
      }
      previous = time; frame = requestAnimationFrame(tick)
    }
    const observer = new ResizeObserver(layout)
    observer.observe(root)
    const fixed = root.parentElement?.querySelector('.contact-section__fixed')
    if (fixed) observer.observe(fixed)
    layout(); frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame); observer.disconnect()
      section?.removeEventListener?.('touchstart', onTouchStart)
      section?.removeEventListener?.('touchmove', onTouchMove)
      section?.removeEventListener?.('touchend', finishTouch)
      section?.removeEventListener?.('touchcancel', finishTouch)
      section?.removeEventListener?.('wheel', onWheel)
      section?.removeEventListener?.('pointerdown', onPointerDown)
      section?.removeEventListener?.('pointerup', onPointerUp)
      if (wheelResetTimer !== null) window.clearTimeout(wheelResetTimer)
      Matter.Composite.clear(engine.world, false); Matter.Engine.clear(engine)
      root.dataset.ready = 'false'
      timers.current.forEach(clearTimeout); timers.current.clear()
      setHint(false); setTooltip(null); setReactions([])
    }
  }, [active])

  const location = (node: HTMLElement) => {
    const root = rootRef.current!, box = root.getBoundingClientRect(), rect = node.getBoundingClientRect()
    const factor = root.clientWidth / box.width
    return { x: (rect.left + rect.width / 2 - box.left) * factor, y: (rect.top - box.top) * factor }
  }
  const showTooltip = (index: number, node: HTMLElement) => {
    const text = contactObjects[index].tooltip
    if (text) setTooltip({ text, ...location(node) })
  }
  const activate = (index: number, node: HTMLElement) => {
    const item = contactObjects[index]; setTooltip(null)
    if (item.action !== 'reaction') { onOpen(item.action); return }
    const choices = item.reactions!, point = location(node)
    const batch = Array.from({ length: Math.floor(randomBetween(2, 6)) }, () => ({
      id: ++sequence.current, text: choices[Math.floor(Math.random() * choices.length)],
      x: point.x + randomBetween(-8, 8), y: point.y + randomBetween(0, 14),
      dx: randomBetween(-60, 60), dy: randomBetween(-140, -60), rotation: randomBetween(-30, 30),
      scale: randomBetween(0.75, 1.25), duration: randomBetween(700, 1500),
    }))
    setReactions(current => [...current, ...batch].slice(-26))
    const timer = window.setTimeout(() => { setReactions(current => current.filter(r => !batch.some(p => p.id === r.id))); timers.current.delete(timer) }, 1450)
    timers.current.add(timer)
  }

  return <div className="contact-objects" ref={rootRef} aria-label="Contact 互动图标" data-ready="false" data-paused={paused}>
    {contactObjects.map((item, i) => <button key={item.id} ref={node => { itemsRef.current[i] = node }}
      className="contact-objects__item" type="button" aria-label={item.label} tabIndex={active ? 0 : -1}
      onClick={event => activate(i, event.currentTarget)}
      onPointerEnter={event => { if (event.pointerType === 'mouse') showTooltip(i, event.currentTarget) }}
      onPointerLeave={() => setTooltip(null)} onFocus={event => showTooltip(i, event.currentTarget)} onBlur={() => setTooltip(null)}>
      <span className="contact-floating-inner"><img src={item.src} alt="" draggable={false} /></span>
    </button>)}
    <p className={`contact-objects__hint${hint ? ' is-visible' : ''}`} aria-live="polite">{hint ? '试试点击这些东西吧' : ''}</p>
    {tooltip && <span className="contact-objects__tooltip" style={{ left: `clamp(90px, ${tooltip.x}px, calc(100% - 90px))`, top: Math.max(28, tooltip.y - 14) }}>{tooltip.text}</span>}
    <div className="contact-objects__reactions" aria-hidden="true">{reactions.map(r => <span key={r.id}
      onAnimationEnd={() => setReactions(current => current.filter(p => p.id !== r.id))}
      style={{ left: r.x, top: r.y, '--reaction-x': `${r.dx}px`, '--reaction-y': `${r.dy}px`, '--reaction-angle': `${r.rotation}deg`, '--reaction-scale': r.scale, '--reaction-duration': `${r.duration}ms` } as CSSProperties}>{r.text}</span>)}</div>
  </div>
}
