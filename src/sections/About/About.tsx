import { motion } from 'motion/react'
import { AmbientBackground } from '../../components/AmbientBackground/AmbientBackground'
import { aboutProfile } from './about.data'
import { AboutPhotoModule } from './AboutPhotoModule'
import './About.css'

const revealItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

export function About() {
  return (
    <section className="about-section" aria-labelledby="about-title">
      <AmbientBackground variant="about" />
      <motion.div
        className="about-section__content"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.16 }}
        variants={{
          hidden: {},
          show: { transition: { delayChildren: 0.08, staggerChildren: 0.08 } },
        }}
      >
        <motion.header className="about-section__heading" data-ambient-safe variants={revealItem}>
          <p className="about-section__eyebrow">Personal introduction / 2026</p>
          <h2 id="about-title" className="about-section__title">about me</h2>
          <p className="about-section__subtitle">(personal profile)</p>
        </motion.header>

        <div className="about-section__information" data-ambient-safe>
          <motion.dl className="about-section__profile-list" variants={revealItem}>
            {aboutProfile.profileItems.map((item) => (
              <div className="about-section__profile-item" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.div className="about-section__skills" variants={revealItem}>
            <h3>Skills</h3>
            <ul>
              {aboutProfile.skills.map((skill) => (
                <li key={skill.label}>
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r="22" />
                    <text x="24" y="29" textAnchor="middle">{skill.code}</text>
                  </svg>
                  <span>{skill.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div className="about-section__status" variants={revealItem}>
            <p>Status / Availability</p>
            <span><i aria-hidden="true" />{aboutProfile.availability}</span>
          </motion.div>
        </div>

        <motion.div
          className="about-section__photo-module-stage"
          data-ambient-safe
          variants={{ hidden: { opacity: 0, y: 24, rotate: 0.5 }, show: { opacity: 1, y: 0, rotate: 0 } }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
          <AboutPhotoModule />
          <p className="about-section__photo-caption">Aster / visual &amp; UI·UX designer</p>
        </motion.div>
      </motion.div>
    </section>
  )
}
