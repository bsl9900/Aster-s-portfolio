import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AmbientBackground } from '../../components/AmbientBackground/AmbientBackground'
import { ProjectDetailViewer } from './ProjectDetailViewer'
import { projectSections } from './projectSections'
import './Contents.css'

type DirectoryChapter = {
  id: string
  title: string
  subtitle: string
  card: string
  detailImages: string[]
}

const assetRoot = `${import.meta.env.BASE_URL}portfolio/phone-directory/`
const detailRoot = `${import.meta.env.BASE_URL}portfolio/project-details/`
const projectImages = (project: string, files: string[]) => files.map((file) => `${detailRoot}${project}/${file}`)

const chapters: DirectoryChapter[] = [
  {
    id: '01', title: '要出发周边游APP视觉改版', subtitle: 'UX全流程', card: `${assetRoot}chapter-01.png`,
    detailImages: projectImages('project-01', ['1.1无卡头.png', '1.2.png', '1.3.png', '1.4.png', '1.5.png', '1.6.png', '1.7.png', '1.8.png', '1.9.png', '1.10.png', '1.11.png', '1.12.png', '1.13.jpg', '1.14.png', '1.15.png', '1.16.png', '1.17.png', '1.18.png', '1.19.png', '1.20.png', '1.21.png', '1.22.png']),
  },
  {
    id: '02', title: '喜马拉雅直播运营视觉设计', subtitle: '线上 + 线下全流程', card: `${assetRoot}chapter-02.png`,
    detailImages: projectImages('project-02', ['2.1无卡头.png', '2.2.jpg', '2.3.png', '2.4.png', '2.5.png', '2.6.png']),
  },
  {
    id: '03', title: '音乐能量岛小游戏运营活动视觉设计', subtitle: '游戏化运营 + AIGC', card: `${assetRoot}chapter-03.png`,
    detailImages: projectImages('project-03', ['1.3无卡.png', '3.2.jpg', '3.3.jpg', '3.4.jpg', '3.5.jpg', '3.6.jpg', '3.7.jpg', '3.8.jpg', '3.9.jpg']),
  },
  {
    id: '04', title: '设计之外 AI探索 + 审美摄影', subtitle: 'AIGC + 兴趣爱好', card: `${assetRoot}chapter-04.png`,
    detailImages: projectImages('project-04', ['4.1无卡头.png', '4.2.png', '4.3.png', '4.4.jpg', '4.5.jpg', '4.6.jpg', '4.7.jpg']),
  },
]

export function Contents() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalMaximized, setIsModalMaximized] = useState(false)
  const reducedMotion = useReducedMotion()
  const chapter = chapters[currentIndex]

  const move = (direction: -1 | 1) => setCurrentIndex((current) => (current + direction + chapters.length) % chapters.length)
  const openModal = () => {
    setIsModalMaximized(false)
    setIsModalOpen(true)
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setIsModalMaximized(false)
  }

  useEffect(() => {
    if (!isModalOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeModal() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isModalOpen])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('portfolio:modal-visibility', { detail: { visible: isModalOpen } }))
    return () => {
      if (isModalOpen) window.dispatchEvent(new CustomEvent('portfolio:modal-visibility', { detail: { visible: false } }))
    }
  }, [isModalOpen])

  return <><section className="contents-section" id="projects" aria-label="Portfolio chapter directory">
    <AmbientBackground variant="projects" />
    <p className="contents-section__label" data-ambient-safe aria-hidden="true">PROJECTS <span>01—04</span></p>
    <div className="contents-section__carousel" data-ambient-safe>
      <button className="contents-section__arrow contents-section__arrow--left" type="button" onClick={() => move(-1)} aria-label="上一章节"><img src={`${assetRoot}arrow-left.png`} alt="" draggable={false} /></button>

      <div className="contents-section__phone-stack">
        <button className="contents-section__phone" type="button" onClick={openModal} aria-label={`打开第 ${chapter.id} 章：${chapter.title}`}>
          <img className="contents-section__phone-frame" src={`${assetRoot}phone-frame.png`} alt="银色手机作品集目录" draggable={false} />
          <span className="contents-section__screen">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img className="contents-section__card" key={chapter.id} src={chapter.card} alt={`#${chapter.id} ${chapter.title}（${chapter.subtitle}）`} initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 18, scale: 0.985 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -18, scale: 0.985 }} transition={{ duration: reducedMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }} draggable={false} />
            </AnimatePresence>
          </span>
        </button>
      </div>

      <button className="contents-section__arrow contents-section__arrow--right" type="button" onClick={() => move(1)} aria-label="下一章节"><img src={`${assetRoot}arrow-left.png`} alt="" draggable={false} /></button>
      <div className="contents-section__dots" aria-label="当前章节">{chapters.map((item, index) => <button className={index === currentIndex ? 'contents-section__dot contents-section__dot--active' : 'contents-section__dot'} type="button" key={item.id} onClick={() => setCurrentIndex(index)} aria-label={`切换到第 ${item.id} 章`} aria-current={index === currentIndex ? 'true' : undefined} />)}</div>
    </div>

  </section>
    {createPortal(<div className="contents-section__modal-root">
      <AnimatePresence>{isModalOpen && <motion.div className="contents-section__modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}>
        <motion.div className={`contents-section__modal${isModalMaximized ? ' is-maximized' : ''}`} role="dialog" aria-modal="true" aria-labelledby="contents-modal-title" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.975 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }} transition={{ duration: reducedMotion ? 0.15 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
          <button className="contents-section__modal-maximize" type="button" onClick={() => setIsModalMaximized((value) => !value)} aria-label={isModalMaximized ? '恢复弹窗尺寸' : '最大化弹窗'} title={isModalMaximized ? 'Restore' : 'Maximize'}>{isModalMaximized ? '❐' : '□'}</button>
          <button className="contents-section__modal-close" type="button" onClick={closeModal} aria-label="关闭详情弹窗">×</button>
          <div className="contents-section__modal-heading"><span>#{chapter.id}</span><div><h2 id="contents-modal-title">{chapter.title}</h2><p>{chapter.subtitle}</p></div></div>
          <ProjectDetailViewer key={chapter.id} images={chapter.detailImages} projectId={chapter.id} sections={projectSections[chapter.id]} title={chapter.title} />
        </motion.div>
      </motion.div>}</AnimatePresence>
    </div>, document.body)}
  </>
}
