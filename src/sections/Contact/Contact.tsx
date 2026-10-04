import { useCallback, useEffect, useRef, useState } from 'react'
import { AmbientBackground } from '../../components/AmbientBackground/AmbientBackground'
import { contactDetails, type ContactAction } from './contact.data'
import { ContactObjects } from './ContactObjects'
import { ContactModal } from './ContactModal'
import './Contact.css'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  const [modal, setModal] = useState<Exclude<ContactAction, 'reaction'> | null>(null)
  const closeModal = useCallback(() => setModal(null), [])
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const visibleEnough = entry.intersectionRect.height >= Math.min(window.innerHeight, entry.boundingClientRect.height) * 0.72
      if (visibleEnough) setActive(true)
      if (!entry.isIntersecting) { setActive(false); setModal(null) }
    }, { threshold: Array.from({ length: 21 }, (_, index) => index / 20) })
    if (root.current) observer.observe(root.current)
    return () => observer.disconnect()
  }, [])

  return <><footer ref={root} id="contact" className="contact-section" aria-label="Contact 联系方式">
    <AmbientBackground variant="contact" />
    <div className="contact-section__decor" aria-hidden="true">
      <img className="contact-section__plant" src={contactDetails.plant} alt="" draggable={false} />
      <p className="contact-section__statement">Let’s get<br className="contact-section__mobile-break" /> in touch</p>
    </div>
    <div className="contact-section__fixed" data-ambient-safe>
      <div className="contact-section__greeting">
        <p className="contact-section__eyebrow">05 / CONTACT</p>
        <h2><img src={contactDetails.title} alt="期待你的联系" /></h2>
      </div>
      <button className="contact-section__qr-button" type="button" onClick={() => setModal('contact')} aria-label="查看微信二维码和联系方式">
        <img src={contactDetails.qr} alt="微信二维码" /><span>LET’S CONNECT · WECHAT ↗</span>
      </button>
    </div>
    <ContactObjects active={active} paused={modal !== null} onOpen={setModal} />
    <p className="contact-section__signature">ASTER* · THANK YOU FOR VISITING</p>
  </footer>{modal && <ContactModal kind={modal} onClose={closeModal} />}</>
}
