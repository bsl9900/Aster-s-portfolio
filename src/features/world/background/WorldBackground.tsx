import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { backgroundScene } from '../../../content/backgroundScene'
import { RippleDistortion } from '../../../components/RippleDistortion'
import './WorldBackground.css'

/** Independent, replaceable environmental layer behind the Day 1 entrance. */
export function WorldBackground() {
  const [isCompact, setIsCompact] = useState(false)
  const [canUseRipple, setCanUseRipple] = useState(false)

  useEffect(() => {
    const compactQuery = window.matchMedia('(max-width: 64rem)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const detectCapability = () => {
      let hasWebGl = false
      try {
        const canvas = document.createElement('canvas')
        hasWebGl = Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch {
        hasWebGl = false
      }
      setIsCompact(compactQuery.matches)
      setCanUseRipple(hasWebGl && !reducedMotionQuery.matches)
    }

    detectCapability()
    compactQuery.addEventListener('change', detectCapability)
    reducedMotionQuery.addEventListener('change', detectCapability)
    return () => {
      compactQuery.removeEventListener('change', detectCapability)
      reducedMotionQuery.removeEventListener('change', detectCapability)
    }
  }, [])

  const disableRipple = useCallback(() => setCanUseRipple(false), [])
  const coverPosition = useMemo(
    () => (isCompact ? backgroundScene.ripple.mobileCoverPosition : backgroundScene.ripple.desktopCoverPosition),
    [isCompact],
  )
  const style = {
    '--world-background-position': backgroundScene.desktopPosition,
    '--world-background-position-mobile': backgroundScene.mobilePosition,
  } as CSSProperties

  return (
    <div className="world-background" style={style} aria-hidden="true">
      <img className="world-background__image" src={backgroundScene.image} alt="" />
      {canUseRipple && (
        <RippleDistortion
          className="world-background__ripple"
          src={backgroundScene.image}
          brushSize={backgroundScene.ripple.brushSize}
          strength={backgroundScene.ripple.strength}
          swirl={backgroundScene.ripple.swirl}
          rings={backgroundScene.ripple.rings}
          grayscale={backgroundScene.ripple.grayscale}
          spread={backgroundScene.ripple.spread}
          fade={backgroundScene.ripple.fade}
          spacing={backgroundScene.ripple.spacing}
          dispersion={backgroundScene.ripple.dispersion}
          glint={backgroundScene.ripple.glint}
          tint={backgroundScene.ripple.tint}
          tintAmount={backgroundScene.ripple.tintAmount}
          highlightColor={backgroundScene.ripple.highlightColor}
          trigger={backgroundScene.ripple.trigger}
          clickStrength={backgroundScene.ripple.clickStrength}
          quality={isCompact ? backgroundScene.ripple.compactQuality : backgroundScene.ripple.desktopQuality}
          coverPosition={coverPosition}
          enabled
          onError={disableRipple}
        />
      )}
    </div>
  )
}
