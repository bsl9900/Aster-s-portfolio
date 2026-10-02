/**
 * Content-facing scene configuration. Replace only these values when the
 * digital world receives a new background asset or a different crop.
 */
export const backgroundScene = {
  image: `${import.meta.env.BASE_URL}background/digital-world-background.png`,
  desktopPosition: 'center center',
  mobilePosition: '58% center',
  ripple: {
    brushSize: 100,
    strength: 0.055,
    swirl: 0.45,
    rings: 1.75,
    grayscale: false,
    spread: 4.25,
    fade: 2.1,
    spacing: 40,
    dispersion: 0.05,
    glint: 0.1,
    tint: '#356cff',
    tintAmount: 0.1,
    highlightColor: '#ffffff',
    trigger: 'both' as const,
    clickStrength: 2.7,
    desktopQuality: 'medium' as const,
    compactQuality: 'low' as const,
    desktopCoverPosition: [0.5, 0.5] as [number, number],
    mobileCoverPosition: [0.58, 0.5] as [number, number],
  },
} as const
