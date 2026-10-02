import { useState } from 'react'
import { photographyItems } from '../../content/photographyArchive'
import { PhotoViewer } from '../archives/PhotoViewer'

/** A controlled staggered grid: stable equal-width columns with measured vertical offsets. */
export function PhotographyArchive() {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const selectedPhoto = photographyItems.find((photo) => photo.id === selectedPhotoId)
  const selectedIndex = selectedPhoto ? photographyItems.findIndex((photo) => photo.id === selectedPhoto.id) : -1

  const selectByOffset = (offset: number) => {
    if (selectedIndex < 0) return
    const nextIndex = (selectedIndex + offset + photographyItems.length) % photographyItems.length
    setSelectedPhotoId(photographyItems[nextIndex].id)
  }

  return (
    <section className="photography-archive" aria-label="Photography Archive">
      <div className="photography-archive__grid">
        {photographyItems.map((item) => (
          <button
            className={`photography-photo photography-photo--column-${item.column} photography-photo--${item.orientation}`}
            type="button"
            key={item.id}
            onClick={() => setSelectedPhotoId(item.id)}
            aria-label={`查看${item.title ?? item.alt}`}
          >
            <img src={item.image} alt={item.alt} />
            {item.title && <span>{item.title}</span>}
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoViewer
          image={selectedPhoto.image}
          alt={selectedPhoto.alt}
          label={selectedPhoto.title}
          onClose={() => setSelectedPhotoId(null)}
          onPrevious={() => selectByOffset(-1)}
          onNext={() => selectByOffset(1)}
        />
      )}
    </section>
  )
}
