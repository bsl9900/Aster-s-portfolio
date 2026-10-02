import { useState } from 'react'
import './DigitalStage.css'
import type { ArchiveEntryConfig } from '../../content/archiveEntries'
import { ArchiveLayer } from '../archives/ArchiveLayer'
import { EntranceGate } from '../entrance/EntranceGate'
import { WorldBackground } from './background/WorldBackground'

/**
 * The quiet, replaceable stage behind the Day 1 entrance. It intentionally has
 * no navigation objects or page content yet.
 */
export function DigitalStage() {
  const [isEntranceOpen, setIsEntranceOpen] = useState(false)
  const [activeArchive, setActiveArchive] = useState<ArchiveEntryConfig | null>(null)

  const handleEntranceChange = (isOpen: boolean) => {
    setIsEntranceOpen(isOpen)
    if (!isOpen) setActiveArchive(null)
  }

  return (
    <main className="digital-stage" aria-label="Personal Digital World">
      <WorldBackground />
      {/* Reserved empty environmental layer: future scenery belongs here. */}
      <div className="digital-stage__environment" aria-hidden="true" />
      <EntranceGate onOpenChange={handleEntranceChange} />
      <ArchiveLayer
        visible={isEntranceOpen}
        activeEntry={activeArchive}
        onOpen={setActiveArchive}
        onClose={() => setActiveArchive(null)}
      />
    </main>
  )
}
