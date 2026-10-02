/**
 * Replace the directory background or any individual card here without touching
 * the Portfolio reader. Coordinates are percentages of the background artwork.
 */
const directoryRoot = `${import.meta.env.BASE_URL}portfolio/directory/`

export const portfolioDirectoryBackground = {
  src: `${directoryRoot}目录底图.jpg`,
  alt: '作品集目录背景',
}

export type PortfolioDirectoryCard = {
  id: string
  label: string
  image: string
  alt: string
  targetProjectId: string
  targetAnchor: string
  x: number
  y: number
  width: number
  aspectRatio: string
  rotation: number
  zIndex: number
}

export const portfolioDirectoryCards: PortfolioDirectoryCard[] = [
  {
    id: 'directory-himalaya',
    label: '喜马拉雅直播运营视觉设计',
    image: `${directoryRoot}目录·01.png`,
    alt: '喜马拉雅直播运营视觉设计目录卡片',
    targetProjectId: 'himalaya',
    targetAnchor: 'himalaya',
    x: 7,
    y: 22,
    width: 24,
    aspectRatio: '1157 / 1412',
    rotation: 0,
    zIndex: 1,
  },
  {
    id: 'directory-you-chufa',
    label: '要出发周边游 APP 视觉改版',
    image: `${directoryRoot}目录·02.png`,
    alt: '要出发周边游 APP 视觉改版目录卡片',
    targetProjectId: 'you-chufa',
    targetAnchor: 'you-chufa',
    x: 28,
    y: 22,
    width: 22,
    aspectRatio: '1036 / 1330',
    rotation: 0,
    zIndex: 2,
  },
  {
    id: 'directory-music-energy-island',
    label: '音乐能量岛小游戏运营活动视觉设计',
    image: `${directoryRoot}目录·03.png`,
    alt: '音乐能量岛小游戏运营活动视觉设计目录卡片',
    targetProjectId: 'music-energy-island',
    targetAnchor: 'music-energy-island',
    x: 47,
    y: 27,
    width: 24,
    aspectRatio: '1160 / 1414',
    rotation: 0,
    zIndex: 3,
  },
  {
    id: 'directory-xiaoshuimian',
    label: '小睡眠形象 IP 设计',
    image: `${directoryRoot}目录·04.png`,
    alt: '小睡眠形象 IP 设计目录卡片',
    targetProjectId: 'xiaoshuimian',
    targetAnchor: 'xiaoshuimian',
    x: 68,
    y: 22,
    width: 24,
    aspectRatio: '1179 / 1426',
    rotation: 0,
    zIndex: 4,
  },
]
