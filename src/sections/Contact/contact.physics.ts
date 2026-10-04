export type ContactSize = { width: number; height: number; collisionWidth: number; collisionHeight: number }
export type ContactPoint = { x: number; y: number }
export const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function contactSizes(items: { id: string; ratio: number }[], width: number, height: number): ContactSize[] {
  const mobile = width < 650
  const cell = width / (mobile ? 3 : 6)
  // Preserve the previous stage's sizing, even though the new physics world spans the section.
  const oldStageHeight = height * (mobile ? 0.51 : 0.54) - (mobile ? 44 : 50)
  return items.map(item => {
    const original = Math.min(mobile ? 125 : 225, cell * 0.83 / item.ratio, oldStageHeight * (mobile ? 0.28 : 0.45))
    const factor = item.id === 'computer' ? 1.5 : item.id === 'year' ? 0.67 : 1
    const h = original * factor
    const w = h * item.ratio
    // Reserve space for the tiny breathing/rotation and hover expansion as well as the PNG.
    return { width: w, height: h, collisionWidth: w * 1.08 + 8, collisionHeight: h * 1.08 + 8 }
  })
}

function overlaps(a: ContactPoint, as: ContactSize, b: ContactPoint, bs: ContactSize, gap = 12) {
  return Math.abs(a.x - b.x) < (as.collisionWidth + bs.collisionWidth) / 2 + gap
    && Math.abs(a.y - b.y) < (as.collisionHeight + bs.collisionHeight) / 2 + gap
}

export function contactTargets(sizes: ContactSize[], width: number, height: number, safeTop: number): ContactPoint[] {
  const order = sizes.map((_, i) => i).sort((a, b) => sizes[b].collisionWidth * sizes[b].collisionHeight - sizes[a].collisionWidth * sizes[a].collisionHeight)
  // Prefer 45–72%. Short/narrow screens may need more vertical room to preserve icon sizes.
  for (const bottomRatio of [0.72, 0.79, 0.87]) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const placed: { point: ContactPoint; index: number }[] = []
      for (const index of order) {
        const size = sizes[index]
        const minY = Math.max(height * 0.45, safeTop + size.collisionHeight / 2 + 14)
        const maxY = Math.min(height * bottomRatio, height - 52 - size.collisionHeight / 2)
        if (minY > maxY) break
        let point: ContactPoint | undefined
        for (let sample = 0; sample < 100; sample++) {
          const candidate = { x: randomBetween(size.collisionWidth / 2 + 10, width - size.collisionWidth / 2 - 10), y: randomBetween(minY, maxY) }
          if (placed.every(other => !overlaps(candidate, size, other.point, sizes[other.index]))) { point = candidate; break }
        }
        if (!point) break
        placed.push({ point, index })
      }
      if (placed.length === sizes.length) {
        const heights = placed.map(({ point }) => point.y)
        // A valid pack must also be visibly staggered, never a coincidental single row.
        if (Math.max(...heights) - Math.min(...heights) < Math.min(height * 0.18, 170)) continue
        const result: ContactPoint[] = []
        for (const { point, index } of placed) result[index] = point
        return result
      }
    }
  }
  // Deterministic shelf fallback for very short viewports; never silently accept overlapping targets.
  const result: ContactPoint[] = []
  let x = 10, y = safeTop + 14, rowHeight = 0
  for (const index of order) {
    const size = sizes[index]
    if (x + size.collisionWidth > width - 10) { x = 10; y += rowHeight + 14; rowHeight = 0 }
    result[index] = { x: x + size.collisionWidth / 2, y: y + size.collisionHeight / 2 }
    x += size.collisionWidth + 14
    rowHeight = Math.max(rowHeight, size.collisionHeight)
  }
  return result
}

export function contactSpawns(sizes: ContactSize[], width: number, targets?: ContactPoint[]): ContactPoint[] {
  const placed: ContactPoint[] = []
  for (const size of sizes) {
    let candidate: ContactPoint
    let tries = 0
    do {
      const target = targets?.[placed.length]
      const x = target ? target.x + randomBetween(-35, 35) : randomBetween(size.collisionWidth / 2 + 8, width - size.collisionWidth / 2 - 8)
      candidate = { x: clamp(x, size.collisionWidth / 2 + 8, width - size.collisionWidth / 2 - 8), y: -size.collisionHeight / 2 - randomBetween(80, 420 + tries * 20) }
      tries++
    } while (placed.some((point, index) => overlaps(candidate, size, point, sizes[index], 18)))
    placed.push(candidate)
  }
  return placed
}
