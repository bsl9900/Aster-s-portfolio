import { useEffect, useState } from 'react'
import type { ArchiveEntryConfig } from '../../content/archiveEntries'
import { archiveEntries } from '../../content/archiveEntries'
import { ArchiveEntry } from './ArchiveEntry'
import { ArchiveWorkspace } from './ArchiveWorkspace'
import { PortfolioDirectory } from '../portfolio/PortfolioDirectory'
import './ArchiveLayer.css'

type ArchiveLayerProps = {
  visible: boolean
  activeEntry: ArchiveEntryConfig | null
  onOpen: (entry: ArchiveEntryConfig) => void
  onClose: () => void
}

/** Independent interaction layer for the three primary Personal Archive entrances. */
export function ArchiveLayer({ visible, activeEntry, onOpen, onClose }: ArchiveLayerProps) {
  useEffect(() => {
    const hasArchiveWorkspace = activeEntry?.windowType === 'portfolio-directory' || activeEntry?.windowType === 'archive-workspace'
    document.body.classList.toggle('portfolio-workspace-open', hasArchiveWorkspace)
    return () => document.body.classList.remove('portfolio-workspace-open')
  }, [activeEntry])

  const closeArchive = () => {
    onClose()
  }

  return (
    <div className={`archive-layer${visible ? ' archive-layer--visible' : ''}`}>
      {visible && (
        <>
          {archiveEntries.map((entry) => <ArchiveEntry entry={entry} onOpen={onOpen} key={entry.id} />)}
          {activeEntry?.windowType === 'portfolio-directory' && (
            <PortfolioDirectory onClose={closeArchive} />
          )}
          {activeEntry?.windowType === 'archive-workspace' && (
            <ArchiveWorkspace
              windowId={activeEntry.id}
              title={activeEntry.windowTitle ?? activeEntry.title}
              icon={activeEntry.icon}
              placeholder={activeEntry.placeholder}
              onClose={closeArchive}
            />
          )}
        </>
      )}
    </div>
  )
}
