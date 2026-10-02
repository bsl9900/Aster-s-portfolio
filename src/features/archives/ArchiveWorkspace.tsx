import { useState } from 'react'
import { PhotographyArchive } from '../photography/PhotographyArchive'
import { TravelDiaryArchive } from '../travel/TravelDiaryArchive'
import { ArchiveWindow } from './ArchiveWindow'
import './ArchiveWorkspace.css'

type ArchiveWorkspaceProps = {
  windowId: string
  title: string
  icon: string
  placeholder: string
  onClose: () => void
}

/** Shared large archive shell for future independent archive modules. */
export function ArchiveWorkspace({ windowId, title, icon, placeholder, onClose }: ArchiveWorkspaceProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  return (
    <div className={`archive-workspace${isMaximized ? ' archive-workspace--maximized' : ''}`}>
      <ArchiveWindow
        windowId={windowId}
        title={title}
        icon={icon}
        onClose={onClose}
        className={`archive-prototype-window${isMaximized ? ' archive-window--maximized' : ''}`}
        isMaximized={isMaximized}
        onToggleMaximize={() => setIsMaximized((current) => !current)}
      >
        <div className="archive-prototype-window__body">
          {windowId === 'photography' && <PhotographyArchive />}
          {windowId === 'travel' && <TravelDiaryArchive />}
          {windowId !== 'photography' && windowId !== 'travel' && (
            <div className="archive-prototype-window__content">
              <img className="archive-prototype-window__icon" src={icon} alt="" />
              <p className="archive-prototype-window__eyebrow">ARCHIVE PROTOTYPE · 01</p>
              <h3>{title}</h3>
              <p>{placeholder}</p>
            </div>
          )}
        </div>
      </ArchiveWindow>
    </div>
  )
}
