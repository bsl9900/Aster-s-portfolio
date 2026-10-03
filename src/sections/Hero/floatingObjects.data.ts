export type FloatingObjectConfig = {
  id: string
  src: string
  mass: number
  frictionAir: number
  restitution: number
  height: { desktop: number; tablet: number; mobile: number }
  aspectRatio: number
  start: { x: number; y: number }
}

type AssetModule = Record<string, string>

const modules = import.meta.glob('../../assets/hero-floating-v2/*.{png,webp,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as AssetModule

const startPositions = [
  { x: 11, y: 9 }, { x: 31, y: 16 }, { x: 52, y: 7 }, { x: 73, y: 17 },
  { x: 90, y: 8 }, { x: 19, y: 35 }, { x: 63, y: 32 }, { x: 84, y: 39 },
  { x: 39, y: 43 }, { x: 54, y: 24 }, { x: 10, y: 50 }, { x: 92, y: 54 },
]

const assetEntries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b, 'en'))
// MP4 is the sole visual-height reference for every principal floating object.
// Width is derived from the source aspect ratio in FloatingObjects.
const MP4_BASE_HEIGHT = { desktop: 132, tablet: 107, mobile: 76 }
const currentAssetHeights: Record<string, typeof MP4_BASE_HEIGHT> = {
  '2005.png': MP4_BASE_HEIGHT,
  'MP4.png': MP4_BASE_HEIGHT,
  'cd.png': MP4_BASE_HEIGHT,
  '兔子’.png': MP4_BASE_HEIGHT,
  '电脑.png': MP4_BASE_HEIGHT,
  '简历.png': MP4_BASE_HEIGHT,
  '手机.png': MP4_BASE_HEIGHT,
}

const aspectRatios: Record<string, number> = {
  '2005.png': 1,
  'MP4.png': 1186 / 1326,
  'cd.png': 1,
  '兔子’.png': 1,
  '电脑.png': 2245 / 1264,
  '简历.png': 1054 / 1493,
  '手机.png': 859 / 1549,
}

export const floatingObjects: readonly FloatingObjectConfig[] = assetEntries.map(([path, src], index) => {
  const fileName = path.replace(/^.*\//, '')
  const height = currentAssetHeights[fileName] ?? MP4_BASE_HEIGHT
  const start = startPositions[index % startPositions.length]
  return {
    id: fileName,
    src,
    mass: Number((0.72 + (index % 5) * 0.18).toFixed(2)),
    frictionAir: Number((0.012 + (index % 4) * 0.004).toFixed(3)),
    restitution: Number((0.42 + (index % 3) * 0.1).toFixed(2)),
    height,
    aspectRatio: aspectRatios[fileName] ?? 1,
    start,
  }
})

export const floatingAssetCount = floatingObjects.length
