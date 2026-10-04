import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import photoCard from '../../assets/about/photo-module/photo-card-base.png'
import headerBackground from '../../assets/about/photo-module/header-background.png'
import stickerLabels from '../../assets/about/photo-module/sticker-labels.png'
import stickerBlue from '../../assets/about/photo-module/sticker-blue.png'
import stickerName from '../../assets/about/photo-module/sticker-name.png'
import './AboutPhotoModule.css'

type StickerProps = {
  className: string
  src: string
  alt: string
}

function Sticker({ className, src, alt }: StickerProps) {
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5

    event.currentTarget.style.setProperty('--sticker-rotate-x', `${-y * 8}deg`)
    event.currentTarget.style.setProperty('--sticker-rotate-y', `${x * 10}deg`)
    event.currentTarget.style.setProperty('--sticker-follow-x', `${x * 5}px`)
    event.currentTarget.style.setProperty('--sticker-follow-y', `${y * 5}px`)
  }

  const resetTilt = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--sticker-rotate-x', '0deg')
    event.currentTarget.style.setProperty('--sticker-rotate-y', '0deg')
    event.currentTarget.style.setProperty('--sticker-follow-x', '0px')
    event.currentTarget.style.setProperty('--sticker-follow-y', '0px')
  }

  const replayPop = (event: PointerEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    button.classList.remove('is-popping')
    void button.offsetWidth
    button.classList.add('is-popping')
  }

  return <span className={`about-photo__sticker ${className}`}>
    <button
      className="about-photo__sticker-button"
      type="button"
      aria-label={`${alt} sticker`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerDown={replayPop}
      onAnimationEnd={(event) => event.currentTarget.classList.remove('is-popping')}
    >
      <img src={src} alt={alt} draggable={false} />
    </button>
  </span>
}

export function AboutPhotoModule() {
  const [mobileGridVisible, setMobileGridVisible] = useState(true)

  const toggleGridForTouch = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse') return
    setMobileGridVisible((visible) => !visible)
  }

  const toggleGridFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    setMobileGridVisible((visible) => !visible)
  }

  return <div className="about-photo" aria-label="Aster portrait verification panel">
    <button
      className={`about-photo__card${mobileGridVisible ? '' : ' about-photo__card--grid-hidden'}`}
      type="button"
      aria-label="Toggle portrait grid lines"
      aria-pressed={!mobileGridVisible}
      onPointerUp={toggleGridForTouch}
      onKeyDown={toggleGridFromKeyboard}
    >
      <img className="about-photo__card-image" src={photoCard} alt="Aster portrait verification card" draggable={false} />
      <span
        className="about-photo__header-background"
        style={{ backgroundImage: `url(${headerBackground})` }}
        aria-hidden="true"
      />
      <span className="about-photo__header-text" aria-hidden="true">
        <span>Select all images with</span>
        <strong>Aster*isk</strong>
      </span>
      <span className="about-photo__grid-overlay" aria-hidden="true">
        <i className="about-photo__grid-line about-photo__grid-line--vertical-one" />
        <i className="about-photo__grid-line about-photo__grid-line--vertical-two" />
        <i className="about-photo__grid-line about-photo__grid-line--horizontal-one" />
        <i className="about-photo__grid-line about-photo__grid-line--horizontal-two" />
      </span>
    </button>

    <Sticker className="about-photo__sticker--labels" src={stickerLabels} alt="Designer and Up Up labels" />
    <Sticker className="about-photo__sticker--blue" src={stickerBlue} alt="Blue character" />
    <Sticker className="about-photo__sticker--name" src={stickerName} alt="My name Aster" />
  </div>
}
