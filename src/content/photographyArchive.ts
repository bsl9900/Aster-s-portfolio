export type PhotoOrientation = 'landscape' | 'portrait' | 'square'
export type PhotoSizeVariant = 'small' | 'medium' | 'large'

export type PhotographyItem = {
  id: string
  image: string
  alt: string
  title?: string
  column: 1 | 2 | 3
  sizeVariant: PhotoSizeVariant
  orientation: PhotoOrientation
}

const photographyRoot = `${import.meta.env.BASE_URL}photography/`

/** Replace each image path and layout metadata here as the photo archive grows. */
export const photographyItems: PhotographyItem[] = [
  { id: 'photo-01', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 01', title: 'Archive Frame 01', column: 1, sizeVariant: 'large', orientation: 'portrait' },
  { id: 'photo-02', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 02', title: 'Archive Frame 02', column: 2, sizeVariant: 'large', orientation: 'landscape' },
  { id: 'photo-03', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 03', title: 'Archive Frame 03', column: 3, sizeVariant: 'medium', orientation: 'square' },
  { id: 'photo-04', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 04', title: 'Archive Frame 04', column: 1, sizeVariant: 'medium', orientation: 'landscape' },
  { id: 'photo-05', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 05', title: 'Archive Frame 05', column: 2, sizeVariant: 'large', orientation: 'portrait' },
  { id: 'photo-06', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 06', title: 'Archive Frame 06', column: 3, sizeVariant: 'medium', orientation: 'portrait' },
  { id: 'photo-07', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 07', title: 'Archive Frame 07', column: 1, sizeVariant: 'small', orientation: 'landscape' },
  { id: 'photo-08', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 08', title: 'Archive Frame 08', column: 2, sizeVariant: 'large', orientation: 'landscape' },
  { id: 'photo-09', image: `${photographyRoot}photo-placeholder.svg`, alt: 'Photography placeholder 09', title: 'Archive Frame 09', column: 3, sizeVariant: 'small', orientation: 'square' },
]
