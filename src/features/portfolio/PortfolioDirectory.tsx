import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { portfolioDirectoryBackground, portfolioDirectoryCards } from '../../content/portfolioDirectoryCards'
import { portfolioDocument } from '../../content/portfolioProjects'
import { ArchiveWindow } from '../archives/ArchiveWindow'
import { ProjectWindow } from './ProjectWindow'
import { TiltedCard } from './TiltedCard'
import './PortfolioWindows.css'

type PortfolioDirectoryProps = {
  onClose: () => void
}

/** Fixed-shell, continuous portfolio document. Navigation only moves its inner viewport. */
export function PortfolioDirectory({ onClose }: PortfolioDirectoryProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [expandedKeyId, setExpandedKeyId] = useState('')
  const [activeProjectId, setActiveProjectId] = useState('')
  const [contentViewport, setContentViewport] = useState<HTMLElement | null>(null)
  const contentViewportRef = useRef<HTMLElement>(null)
  const lastNavigationRef = useRef<{ target: string; projectId: string } | null>(null)
  const setContentViewportRef = useCallback((element: HTMLElement | null) => {
    contentViewportRef.current = element
    setContentViewport(element)
  }, [])

  const scrollToAnchor = useCallback((target: string, projectId = '', behavior: ScrollBehavior = 'smooth') => {
    const viewport = contentViewportRef.current
    const destination = viewport?.querySelector<HTMLElement>(`[data-portfolio-anchor="${target}"]`)
    if (!viewport || !destination) return

    const project = destination.closest<HTMLElement>('[data-project-id]')
    const readerOffset = project?.querySelector<HTMLElement>('.project-window__reader-bar')?.offsetHeight ?? 0

    const targetTop =
      destination.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop - readerOffset - 12

    viewport.scrollTo({
      top: Math.max(0, targetTop),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior,
    })
  }, [])

  const navigateTo = useCallback((target: string, projectId = '') => {
    lastNavigationRef.current = { target, projectId }
    setActiveProjectId(projectId)
    scrollToAnchor(target, projectId)
  }, [scrollToAnchor])

  const repositionAfterContentLoad = useCallback((projectId: string) => {
    const lastNavigation = lastNavigationRef.current
    if (!lastNavigation || lastNavigation.projectId !== projectId) return
    requestAnimationFrame(() => scrollToAnchor(lastNavigation.target, projectId, 'auto'))
  }, [scrollToAnchor])

  const syncActiveProject = () => {
    const viewport = contentViewportRef.current
    if (!viewport) return

    const readingLine = viewport.getBoundingClientRect().top + 80
    const visibleProject = Array.from(viewport.querySelectorAll<HTMLElement>('[data-project-id]')).find((project) => {
      const bounds = project.getBoundingClientRect()
      return bounds.top <= readingLine && bounds.bottom > readingLine
    })

    setActiveProjectId(visibleProject?.dataset.projectId ?? '')
  }

  return (
    <div className={`portfolio-workspace${isMaximized ? ' portfolio-workspace--maximized' : ''}`}>
      <ArchiveWindow
        windowId="portfolio-directory"
        title="2026 PORTFOLIO ARCHIVE"
        onClose={onClose}
        className={`portfolio-directory${isMaximized ? ' archive-window--maximized' : ''}`}
        isMaximized={isMaximized}
        onToggleMaximize={() => setIsMaximized((current) => !current)}
      >
        <div className="portfolio-directory__body">
          <main className="portfolio-directory__content" ref={setContentViewportRef} onScroll={syncActiveProject} aria-live="polite">
            <section className="portfolio-page portfolio-page--cover" data-portfolio-anchor={portfolioDocument.cover.id}>
              <img src={portfolioDocument.cover.visual.src} alt={portfolioDocument.cover.visual.alt} />
            </section>

            <section className="portfolio-page" data-portfolio-anchor={portfolioDocument.introduction.id}>
              <img src={portfolioDocument.introduction.visual.src} alt={portfolioDocument.introduction.visual.alt} />
            </section>

            <section className="portfolio-page portfolio-page--contents" data-portfolio-anchor={portfolioDocument.contents.id}>
              <div className="portfolio-contents-directory">
                <img className="portfolio-contents-directory__background" src={portfolioDirectoryBackground.src} alt={portfolioDirectoryBackground.alt} />
                <div className="portfolio-contents-directory__cards" aria-label="作品集项目目录">
                  {portfolioDirectoryCards.map((card) => (
                    <button
                      className="portfolio-contents-directory__card"
                      key={card.id}
                      type="button"
                      aria-label={`打开${card.label}`}
                      onClick={() => navigateTo(card.targetAnchor, card.targetProjectId)}
                      style={{
                        left: `${card.x}%`,
                        top: `${card.y}%`,
                        width: `${card.width}%`,
                        aspectRatio: card.aspectRatio,
                        zIndex: card.zIndex,
                        '--directory-card-rotation': `${card.rotation}deg`,
                      } as CSSProperties}
                    >
                      <TiltedCard imageSrc={card.image} altText={card.alt} rotateAmplitude={5} scaleOnHover={1.045} />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {portfolioDocument.projects.map((project) => (
              <ProjectWindow
                key={project.id}
                project={project}
                contentViewport={contentViewport}
                isActive={activeProjectId === project.id}
                onNavigate={navigateTo}
                onContentResize={repositionAfterContentLoad}
              />
            ))}

            <section className="portfolio-page portfolio-page--thanks" data-portfolio-anchor={portfolioDocument.thanks.id}>
              <img src={portfolioDocument.thanks.visual.src} alt={portfolioDocument.thanks.visual.alt} />
            </section>
          </main>
        </div>
      </ArchiveWindow>

      <nav className="portfolio-project-keys" aria-label="Portfolio projects">
        {portfolioDocument.projects.map((project, index) => {
          const isSelected = activeProjectId === project.id
          const isExpanded = expandedKeyId === project.id

          return (
            <button
              className={`portfolio-project-key${isSelected ? ' portfolio-project-key--selected' : ''}${isExpanded ? ' portfolio-project-key--expanded' : ''}`}
              type="button"
              key={project.id}
              aria-label={`${String(index + 1).padStart(2, '0')} ${project.title}`}
              aria-pressed={isSelected}
              onClick={() => {
                setExpandedKeyId(project.id)
                navigateTo(project.id, project.id)
              }}
            >
              <span className="portfolio-project-key__number">{String(index + 1).padStart(2, '0')}</span>
              <span className="portfolio-project-key__copy">
                <strong>{project.shortLabel}</strong>
                <small>{project.title}</small>
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
