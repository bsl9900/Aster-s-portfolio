import player from '../../assets/hero/floating/player.png'
import music from '../../assets/hero/floating/music.png'
import year from '../../assets/hero/floating/year.png'
import rabbit from '../../assets/hero/floating/rabbit.png'
import pocketPc from '../../assets/hero/floating/pocket-pc.png'

export type FloatingObjectConfig = {
  id: string
  src: string
  x: number
  y: number
  size: { desktop: number; tablet: number; mobile: number }
  mass: number
  damping: number
  gravityScale: number
  spring: number
  depth: number
  idle: { amplitude: number; duration: number; phase: number }
}

// Add future transparent assets here. Each object keeps its own size and physics profile.
export const floatingObjects: readonly FloatingObjectConfig[] = [
  {
    id: 'player', src: player, x: 12, y: 20,
    size: { desktop: 122, tablet: 94, mobile: 66 },
    mass: 0.78, damping: 0.082, gravityScale: 0.72, spring: 0.0018, depth: 1.15,
    idle: { amplitude: 4, duration: 6.8, phase: 0.4 },
  },
  {
    id: 'music', src: music, x: 86, y: 21,
    size: { desktop: 90, tablet: 72, mobile: 54 },
    mass: 1.18, damping: 0.105, gravityScale: 1.08, spring: 0.0024, depth: 0.8,
    idle: { amplitude: 3, duration: 8.2, phase: 2.6 },
  },
  {
    id: 'year', src: year, x: 13, y: 78,
    size: { desktop: 148, tablet: 108, mobile: 82 },
    mass: 1.46, damping: 0.12, gravityScale: 1.22, spring: 0.0028, depth: 0.72,
    idle: { amplitude: 3, duration: 9.4, phase: 1.4 },
  },
  {
    id: 'rabbit', src: rabbit, x: 87, y: 78,
    size: { desktop: 104, tablet: 82, mobile: 62 },
    mass: 0.68, damping: 0.072, gravityScale: 0.58, spring: 0.0016, depth: 1.3,
    idle: { amplitude: 5, duration: 7.4, phase: 4.2 },
  },
  {
    id: 'pocket-pc', src: pocketPc, x: 87, y: 52,
    size: { desktop: 112, tablet: 88, mobile: 66 },
    mass: 1.02, damping: 0.096, gravityScale: 0.92, spring: 0.0021, depth: 0.96,
    idle: { amplitude: 3, duration: 8.8, phase: 5.6 },
  },
] as const
