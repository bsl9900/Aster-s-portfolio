import { useEffect } from 'react'

type PhotoViewerProps = {
  image: string
  alt: string
  label?: string
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
}

/** Shared in-window image viewer for Photography and Travel archives. */
export function PhotoViewer({ image, alt, label, onClose, onPrevious, onNext }: PhotoViewerProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onPrevious?.()
      if (event.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="archive-photo-viewer" role="dialog" aria-modal="true" aria-label={label ?? alt}>
      <button className="archive-photo-viewer__backdrop" type="button" onClick={onClose} aria-label="关闭图片查看器" />
      <figure className="archive-photo-viewer__frame">
        <img src={image} alt={alt} />
        {label && <figcaption>{label}</figcaption>}
        {onPrevious && <button className="archive-photo-viewer__previous" type="button" onClick={onPrevious} aria-label="查看上一张图片">‹</button>}
        {onNext && <button className="archive-photo-viewer__next" type="button" onClick={onNext} aria-label="查看下一张图片">›</button>}
        <button className="archive-photo-viewer__close" type="button" onClick={onClose} aria-label="关闭图片查看器">×</button>
      </figure>
    </div>
  )
}
