import type { ReactNode } from 'react'

type ArchiveWindowProps = {
  windowId: string
  title: string
  onClose: () => void
  icon?: string
  children?: ReactNode
  className?: string
  isMaximized?: boolean
  onToggleMaximize?: () => void
}

/** Reusable early-internet window shell for archive directories and projects. */
export function ArchiveWindow({
  windowId,
  title,
  icon,
  onClose,
  children,
  className = '',
  isMaximized = false,
  onToggleMaximize,
}: ArchiveWindowProps) {
  return (
    <section className={`archive-window ${className}`.trim()} role="dialog" aria-modal="false" aria-labelledby={`archive-window-${windowId}`}>
      <header className="archive-window__titlebar">
        <span className="archive-window__status" aria-hidden="true" />
        <h2 id={`archive-window-${windowId}`}>{title}</h2>
        {onToggleMaximize && (
          <button
            className="archive-window__maximize"
            type="button"
            onClick={onToggleMaximize}
            aria-label={isMaximized ? `恢复${title}窗口大小` : `最大化${title}窗口`}
            aria-pressed={isMaximized}
          >
            {isMaximized ? '▣' : '□'}
          </button>
        )}
        <button className="archive-window__close" type="button" onClick={onClose} aria-label={`关闭${title}`}>×</button>
      </header>
      {children ?? (
        <div className="archive-window__body">
          {icon && <img className="archive-window__icon" src={icon} alt="" />}
          <p>Archive prototype · 内容将在后续阶段归档。</p>
          <span className="archive-window__footer">ARCHIVE PROTOTYPE · 01</span>
        </div>
      )}
    </section>
  )
}
