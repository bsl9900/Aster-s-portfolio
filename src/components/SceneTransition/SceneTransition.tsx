import { useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import './SceneTransition.css'

export type SceneDirection = 'forward' | 'backward'

type SceneTransitionProps = {
  direction: SceneDirection
  onCovered: () => void
  onComplete: () => void
}

export function SceneTransition({ direction, onCovered, onComplete }: SceneTransitionProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const foreground = direction === 'forward'
      ? document.querySelector<HTMLElement>('.hero-section')
      : ['.about-section', '.contents-section', '.experience-section', '.projects-section', '.personal-archive-section', '.contact-section']
        .map((selector) => document.querySelector<HTMLElement>(selector))
        .find((section) => {
          if (!section) return false
          const bounds = section.getBoundingClientRect()
          return bounds.top <= 56 && bounds.bottom > 56
        }) ?? document.querySelector<HTMLElement>('.about-section')
    if (!foreground?.parentElement) {
      onCovered()
      onComplete()
      return
    }

    const parent = foreground.parentElement
    const placeholder = document.createElement('div')
    const originalStyle = foreground.getAttribute('style')
    const viewportHeight = window.innerHeight
    let completed = false
    let launchFrame = 0
    let revealTimer = 0
    let completeTimer = 0

    placeholder.className = 'scene-transition__spacer'
    placeholder.setAttribute('aria-hidden', 'true')
    placeholder.style.height = `${foreground.offsetHeight}px`
    parent.insertBefore(placeholder, foreground)

    Object.assign(foreground.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '40',
      width: '100%',
      height: `${viewportHeight}px`,
      margin: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
      transform: 'translate3d(0, 0, 0) rotate(0deg)',
      transformOrigin: direction === 'forward' ? '50% 0%' : '50% 100%',
      transition: 'none',
      willChange: 'transform',
    })

    const restore = (notify = false) => {
      if (completed) return
      completed = true
      cancelAnimationFrame(launchFrame)
      window.clearTimeout(revealTimer)
      window.clearTimeout(completeTimer)
      placeholder.remove()
      if (originalStyle === null) foreground.removeAttribute('style')
      else foreground.setAttribute('style', originalStyle)
      if (notify) onComplete()
    }

    revealTimer = window.setTimeout(() => {
      onCovered()
      launchFrame = requestAnimationFrame(() => {
        foreground.style.transition = `transform ${reducedMotion ? 0.01 : 0.48}s cubic-bezier(0.64, 0, 0.78, 0)`
        foreground.style.transform = direction === 'forward'
          ? 'translate3d(11vw, 108vh, 0) rotate(4deg)'
          : 'translate3d(-8vw, -106vh, 0) rotate(-3.5deg)'
      })
    }, reducedMotion ? 0 : 70)

    completeTimer = window.setTimeout(() => restore(true), reducedMotion ? 40 : 570)
    return () => restore()
  }, [direction, onComplete, onCovered, reducedMotion])

  return <div className="scene-transition" aria-hidden="true" />
}
