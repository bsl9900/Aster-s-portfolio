import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Experience.css'

gsap.registerPlugin(ScrollTrigger)
const receipts = [['01', 'Education'], ['02', 'Internship'], ['03', 'Project / Activity'], ['04', 'Graduation'], ['05', 'Current Stage']]

export function Experience() {
  const root = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.experience-section__receipt')
      gsap.set(cards, { autoAlpha: 0.22, scale: 0.84 })
      gsap.set(cards[0], { autoAlpha: 1, scale: 1 })
      const timeline = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
      cards.slice(1).forEach((card, index) => {
        const previous = cards[index]
        timeline.to(previous, { autoAlpha: 0.22, scale: 0.84, duration: 1 }, index)
          .to(card, { autoAlpha: 1, scale: 1, duration: 1 }, index)
          .to('.experience-section__track', { xPercent: index % 2 === 0 ? -3 : 3, duration: 1 }, index)
      })
    }, root)
    return () => context.revert()
  }, [])
  return <section ref={root} className="experience-section" aria-labelledby="experience-title"><div className="experience-section__board"><div className="experience-section__intro"><p className="portfolio-app__eyebrow">03 / Experience</p><h2 id="experience-title">Thermal timeline</h2><p>Scroll to scan each record.</p></div><div className="experience-section__viewport"><div className="experience-section__track">{receipts.map(([number, label]) => <article className="experience-section__receipt" key={number}><span>ARCHIVE RECEIPT — {number}</span><h3>{label}</h3><div className="experience-section__line" /><p>Placeholder record<br />Date / Place / Detail</p><small>THANK YOU FOR SCANNING</small></article>)}</div></div></div></section>
}
