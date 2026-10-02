import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

type TiltedCardProps = {
  imageSrc: string
  altText: string
  rotateAmplitude?: number
  scaleOnHover?: number
}

const spring = { damping: 30, stiffness: 150, mass: 1.3 }

/** Lightweight local React Bits TiltedCard variant for the Portfolio directory. */
export function TiltedCard({ imageSrc, altText, rotateAmplitude = 5, scaleOnHover = 1.045 }: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(0, spring)
  const rotateY = useSpring(0, spring)
  const scale = useSpring(1, spring)

  const resetTilt = () => {
    rotateX.set(0)
    rotateY.set(0)
    scale.set(1)
  }

  return (
    <motion.div
      ref={cardRef}
      className="tilted-card"
      style={{ rotateX, rotateY, scale }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || !cardRef.current) return
        const bounds = cardRef.current.getBoundingClientRect()
        const horizontal = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)
        const vertical = (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)
        rotateX.set(vertical * -rotateAmplitude)
        rotateY.set(horizontal * rotateAmplitude)
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') scale.set(scaleOnHover)
      }}
      onPointerLeave={resetTilt}
    >
      <img src={imageSrc} alt={altText} draggable={false} />
    </motion.div>
  )
}
