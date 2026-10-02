export type TravelPhoto = {
  image: string
  alt: string
  /** Small map-card image; the full artwork remains reserved for the viewer. */
  thumbnail?: string
}

export type TravelPlace = {
  id: string
  province: string
  city: string
  lat: number
  lng: number
  visited: boolean
  hasPhotos: boolean
  markerColor: string
  /** Optional short city note for future travel records. */
  description?: string
  /** Rotation keeps the pinned-photo layer feeling physical without encoding layout in the map component. */
  polaroidAngle?: number
  photos: TravelPhoto[]
}

const travelRoot = `${import.meta.env.BASE_URL}travel-diary/`

/** Add future cities and photos here without changing the Leaflet map or viewer components. */
export const travelPlaces: TravelPlace[] = [
  {
    id: 'beijing',
    province: '北京市',
    city: '北京',
    lat: 39.9042,
    lng: 116.4074,
    visited: true,
    hasPhotos: true,
    markerColor: '#2879df',
    description: '旅行记录待补充',
    polaroidAngle: -5,
    photos: [{ image: `${travelRoot}beijing.png`, thumbnail: `${travelRoot}travel-placeholder.svg`, alt: '北京旅行影像拼贴' }],
  },
  {
    id: 'hangzhou',
    province: '浙江省',
    city: '杭州',
    lat: 30.2741,
    lng: 120.1551,
    visited: true,
    hasPhotos: true,
    markerColor: '#2879df',
    description: '旅行记录待补充',
    polaroidAngle: 4,
    photos: [{ image: `${travelRoot}hangzhou.png`, thumbnail: `${travelRoot}travel-placeholder.svg`, alt: '杭州旅行影像拼贴' }],
  },
]
