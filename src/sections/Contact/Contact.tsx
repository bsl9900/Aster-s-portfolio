import { motion } from 'motion/react'
import './Contact.css'
export function Contact() { return <footer className="contact-section"><motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.6 }}><p className="portfolio-app__eyebrow">06 / Contact</p><h2>Thanks for<br />watching.</h2><a href="mailto:hello@example.com">hello@example.com</a><span>Social / Placeholder</span></motion.div></footer> }
