export type ArchiveId = 'portfolio' | 'photography' | 'travel'

export type ArchiveEntryConfig = {
  id: ArchiveId
  title: string
  windowTitle?: string
  label: string
  icon: string
  placeholder: string
  windowType: 'portfolio-directory' | 'archive-workspace'
}

const navigationRoot = `${import.meta.env.BASE_URL}navigation/`

/** Replace labels, artwork paths, or prototype copy here without changing the shell. */
export const archiveEntries: ArchiveEntryConfig[] = [
  {
    id: 'portfolio',
    title: '2026作品集档案',
    label: 'PROJECT ARCHIVE',
    icon: `${navigationRoot}portfolio-archive.svg`,
    placeholder: '2026 Portfolio Directory · 内容将在下一阶段归档。',
    windowType: 'portfolio-directory',
  },
  {
    id: 'photography',
    title: '摄影档案',
    windowTitle: 'Photography Archive',
    label: 'IMAGE ARCHIVE',
    icon: `${navigationRoot}photography-archive.svg`,
    placeholder: 'Photography Archive · 独立摄影空间将在下一阶段整理。',
    windowType: 'archive-workspace',
  },
  {
    id: 'travel',
    title: '旅游档案',
    windowTitle: 'Travel Diary Archive',
    label: 'TRAVEL DATABASE',
    icon: `${navigationRoot}travel-archive.svg`,
    placeholder: 'Travel Diary Archive · 地图、票据与日记将在下一阶段加入。',
    windowType: 'archive-workspace',
  },
]
