import { motion, useReducedMotion } from 'motion/react'
import { RefObject } from 'react'
import { useComputerInteraction } from './useComputerInteraction'
import { ComputerViews } from './ComputerViews'

type Cursor = { x: number; y: number; nx: number; ny: number; active: boolean }

export function HeroComputer(_props: { cursor: RefObject<Cursor> }) {
  const reduced = useReducedMotion()
  const interaction = useComputerInteraction(reduced)

  return <div className="hero-computer">
    <motion.div className="hero-computer__float"
      animate={{ y: reduced ? 0 : [0, -10, 0] }}
      transition={{ duration: 4.8, ease: 'easeInOut', repeat: Infinity }}>
      <motion.button className="hero-computer__object hero-computer__feedback hero-computer__entry"
        type="button" aria-label="Enter About"
        ref={interaction.buttonRef}
        {...interaction.handlers}
        style={{ transformPerspective: 850, rotateX: interaction.rotateX, rotateY: interaction.rotateY, cursor: interaction.dragging ? 'grabbing' : 'pointer', WebkitTouchCallout: 'none', userSelect: 'none' }}>
        <ComputerViews angle={interaction.rotateY} />
      </motion.button>
    </motion.div>
  </div>
}
