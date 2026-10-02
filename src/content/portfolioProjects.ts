export type PortfolioModule = {
  label: string
  target: string
}

export type ProjectImage = {
  src: string
  alt: string
}

export type PortfolioSection = {
  id: string
  label: string
  description: string
  images: ProjectImage[]
}

/** A stable, reader-facing anchor inside one project's continuous pages. */
export type PortfolioChapter = {
  id: string
  label: string
  /** Keep unfinished chapter metadata ready without exposing a false navigation target. */
  visible?: boolean
}

export type PortfolioProject = {
  id: string
  title: string
  shortLabel: string
  subtitle: string
  /** Designed pages can include their own typography, so their project chrome may be omitted. */
  showIntro?: boolean
  year: string
  category: string
  thumbnail: string
  modules: PortfolioModule[]
  /** Internal reader navigation. Keep this alongside the page groups it targets. */
  chapters?: PortfolioChapter[]
  sections: PortfolioSection[]
}

export type PortfolioDocument = {
  cover: {
    id: string
    title: string
    year: string
    visual: ProjectImage
  }
  introduction: {
    id: string
    title: string
    name: string
    intro: string
    visual: ProjectImage
  }
  contents: {
    id: string
    title: string
    visual: ProjectImage
  }
  projects: PortfolioProject[]
  thanks: {
    id: string
    title: string
    description: string
    visual: ProjectImage
  }
}

const portfolioRoot = `${import.meta.env.BASE_URL}portfolio/`
const frontMatterRoot = `${portfolioRoot}front-matter/`
const youChufaRoot = `${portfolioRoot}you-chufa/`
const musicEnergyIslandRoot = `${portfolioRoot}music-energy-island/`
const xiaoshuimianRoot = `${portfolioRoot}xiaoshuimian/`
const youChufaPageNumbers = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
const youChufaPages: ProjectImage[] = youChufaPageNumbers.map((pageNumber) => ({
  src: `${youChufaRoot}2.${pageNumber}.png`,
  alt: `要出发周边游 APP 视觉改版，第 ${pageNumber} 页`,
}))
const musicEnergyIslandPageNumbers = [1, 3, 4, 8, 9]
const musicEnergyIslandPages: ProjectImage[] = musicEnergyIslandPageNumbers.map((pageNumber) => ({
  src: `${musicEnergyIslandRoot}3.${pageNumber}.jpg`,
  alt: `音乐能量岛小游戏运营活动视觉设计，第 ${pageNumber} 页`,
}))
const xiaoshuimianPageNumbers = [1, 2, 3, 4, 5, 6, 7]
const xiaoshuimianPages: ProjectImage[] = xiaoshuimianPageNumbers.map((pageNumber) => ({
  src: `${xiaoshuimianRoot}4.${pageNumber}.png`,
  alt: `小睡眠形象 IP 设计，第 ${pageNumber} 页`,
}))

const youChufaSections: PortfolioSection[] = [
  {
    id: 'you-chufa-overview',
    label: '',
    description: '',
    images: youChufaPages.slice(0, 3),
  },
  {
    id: 'you-chufa-ordering',
    label: '',
    description: '',
    images: youChufaPages.slice(3, 8),
  },
  {
    id: 'you-chufa-custom-route',
    label: '',
    description: '',
    images: youChufaPages.slice(8, 13),
  },
  {
    id: 'you-chufa-membership-flow',
    label: '',
    description: '',
    images: youChufaPages.slice(13, 17),
  },
  {
    id: 'you-chufa-visual-upgrade',
    label: '',
    description: '',
    images: youChufaPages.slice(17),
  },
]

/** Keep the five future project chapters as data-only placeholders until their content is supplied. */
export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'himalaya',
    title: '喜马拉雅直播运营视觉设计',
    shortLabel: '喜马拉雅 · Visual',
    subtitle: 'Project placeholder · content will be added later.',
    year: '2026',
    category: 'Live Visual Operations',
    thumbnail: `${portfolioRoot}himalaya/01.svg`,
    modules: [],
    // Content has not been supplied yet. Add visible chapters here only once their
    // matching anchors/pages exist; the reader deliberately renders no false tabs.
    chapters: [],
    sections: [{ id: 'himalaya-placeholder', label: 'PROJECT PLACEHOLDER', description: '喜马拉雅项目内容将在后续阶段导入。', images: [] }],
  },
  {
    id: 'you-chufa',
    title: '要出发周边游 APP 视觉改版',
    shortLabel: '要出发 · UX/UI',
    subtitle: '',
    showIntro: false,
    year: '2026',
    category: 'UX / UI',
    thumbnail: youChufaPages[0].src,
    modules: [],
    chapters: [
      { id: 'you-chufa-overview', label: '项目概况' },
      { id: 'you-chufa-ordering', label: '下单体验' },
      { id: 'you-chufa-custom-route', label: '定制路线' },
      { id: 'you-chufa-membership-flow', label: '会员链路' },
      { id: 'you-chufa-visual-upgrade', label: '视觉升级' },
    ],
    sections: youChufaSections,
  },
  {
    id: 'music-energy-island',
    title: '音乐能量岛小游戏运营活动视觉设计',
    shortLabel: '音乐能量岛 · Campaign',
    subtitle: '',
    showIntro: false,
    year: '2026',
    category: 'Campaign',
    thumbnail: musicEnergyIslandPages[0].src,
    modules: [],
    // Chapter names/anchors are intentionally left empty until supplied; do not
    // infer them from visual pages alone.
    chapters: [],
    sections: [{ id: 'music-energy-island-campaign', label: '', description: '', images: musicEnergyIslandPages }],
  },
  {
    id: 'xiaoshuimian',
    title: '小睡眠形象 IP 设计',
    shortLabel: '小睡眠 · IP',
    subtitle: '',
    showIntro: false,
    year: '2026',
    category: 'IP Design',
    thumbnail: xiaoshuimianPages[0].src,
    modules: [],
    // Chapter names/anchors are intentionally left empty until supplied.
    chapters: [],
    sections: [{ id: 'xiaoshuimian-ip', label: '', description: '', images: xiaoshuimianPages }],
  },
  {
    id: 'xinyu',
    title: '心遇 APP 界面动效设计',
    shortLabel: '心遇 · Motion',
    subtitle: 'Project placeholder · content will be added later.',
    year: '2026',
    category: 'Motion Design',
    thumbnail: `${portfolioRoot}himalaya/01.svg`,
    modules: [],
    chapters: [],
    sections: [{ id: 'xinyu-placeholder', label: 'PROJECT PLACEHOLDER', description: '心遇动效项目内容将在后续阶段导入。', images: [] }],
  },
]

/** Front matter and chapter order stay replaceable without changing Portfolio components. */
export const portfolioDocument: PortfolioDocument = {
  cover: {
    id: 'portfolio-cover',
    title: '2026 PORTFOLIO',
    year: '2026',
    visual: { src: `${frontMatterRoot}cover.jpg`, alt: '2026 Portfolio cover' },
  },
  introduction: {
    id: 'portfolio-introduction',
    title: 'Personal Introduction',
    name: 'Personal Portfolio',
    intro: '个人介绍、设计方向与更多文字内容将在此处继续补充。',
    visual: { src: `${frontMatterRoot}personal-introduction.jpg`, alt: 'Personal introduction page' },
  },
  contents: {
    id: 'portfolio-contents',
    title: 'Contents',
    visual: { src: `${portfolioRoot}directory/目录底图.jpg`, alt: '作品集目录背景' },
  },
  projects: portfolioProjects,
  thanks: {
    id: 'portfolio-thanks',
    title: 'Thanks for Watching',
    description: '结尾视觉、联系信息与更多内容将在此处继续归档。',
    visual: { src: `${frontMatterRoot}thanks.jpg`, alt: '作品集结尾页面' },
  },
}
