import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { JellyRadio, JellyRadioItem } from './JellyRadio'
import './PortfolioJellyNav.css'

const items: JellyRadioItem[] = [{ value: 'start', label: 'START' }, { value: 'about', label: 'ABOUT' }, { value: 'experience', label: 'EXPERIENCE' }, { value: 'projects', label: 'PROJECTS' }, { value: 'archive', label: 'ARCHIVE' }, { value: 'contact', label: 'CONTACT' }]
const targets = { start: '.hero-section', about: '.about-section', experience: '.experience-section', projects: '.projects-section', archive: '.personal-archive-section', contact: '.contact-section' } as const

export function PortfolioJellyNav() {
  const visible = true; const [active, setActive] = useState('about'); const reducedMotion = useReducedMotion()
  useEffect(() => {
    const sections = items.flatMap((item) => {
      const section = document.querySelector<HTMLElement>(targets[item.value as keyof typeof targets])
      if (!section) return []
      section.id = item.value
      return [section]
    })
    const observer = new IntersectionObserver((entries) => { const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (current) setActive(current.target.id) }, { rootMargin: '-32% 0px -52% 0px', threshold: [0.05, 0.2, 0.45] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])
  const navigate = (value: string) => {
    if (value === 'start') {
      window.dispatchEvent(new CustomEvent('portfolio:scene-navigate', { detail: { direction: 'backward' } }))
      return
    }
    setActive(value)
    document.getElementById(value)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return <AnimatePresence>{visible && <motion.nav className="portfolio-jelly-nav" aria-label="Portfolio navigation" style={{ x: '-50%' }} initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}><div className="portfolio-jelly-nav__inner"><JellyRadio items={items} value={active} onValueChange={navigate} chipColor="linear-gradient(180deg, #ffffff, #d6d6d6)" activeColor="#ffffff" textColor="#111111" activeTextColor="#111111" size="md" gap={4} radius={4} swell={0.08} barge={2} shrink={0.03} jelly={0.35} bounce={0.12} stagger={12} stiffness={580} /></div></motion.nav>}</AnimatePresence>
}
