import type { ArchiveEntryConfig } from '../../content/archiveEntries'

type ArchiveEntryProps = {
  entry: ArchiveEntryConfig
  onOpen: (entry: ArchiveEntryConfig) => void
}

/** A placed desktop object, deliberately not a conventional navigation button. */
export function ArchiveEntry({ entry, onOpen }: ArchiveEntryProps) {
  return (
    <button
      className={`archive-entry archive-entry--${entry.id}`}
      type="button"
      onClick={() => onOpen(entry)}
      aria-label={`打开${entry.title}`}
    >
      <img className="archive-entry__icon" src={entry.icon} alt="" />
      <span className="archive-entry__title">{entry.title}</span>
      <span className="archive-entry__label">{entry.label}</span>
    </button>
  )
}
