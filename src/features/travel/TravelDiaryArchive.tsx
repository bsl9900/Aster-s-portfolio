import { useEffect, useMemo, useState } from 'react'
import { divIcon, type Layer, type Path, type PathOptions } from 'leaflet'
import { GeoJSON, MapContainer, Marker, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { travelPlaces, type TravelPlace } from '../../content/travelDiary'
import chinaProvinces from '../../data/china-provinces.json'
import { TravelPhotoViewer } from './TravelPhotoViewer'

const chinaCenter: [number, number] = [35.8617, 104.1954]
const chinaProvinceGeoJson = chinaProvinces as GeoJSON.GeoJsonObject

type ProvinceProperties = { name?: string }

/** Recalculates Leaflet after the archive window appears or changes size. */
function MapSizeLifecycle() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    let frame = 0
    const refresh = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false, debounceMoveend: true }))
    }

    refresh()
    const settleTimer = window.setTimeout(refresh, 180)
    const observer = new ResizeObserver(refresh)
    observer.observe(container)
    window.addEventListener('orientationchange', refresh)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
      observer.disconnect()
      window.removeEventListener('orientationchange', refresh)
    }
  }, [map])

  return null
}

const cityMarkerIcon = (markerColor: string) => divIcon({
  className: 'travel-leaflet-marker-icon',
  html: `<span style="--marker-color:${markerColor}"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const polaroidMarkerIcon = (place: TravelPlace) => divIcon({
  className: 'travel-leaflet-polaroid-icon',
  html: `<span class="travel-leaflet-polaroid" style="--polaroid-angle:${place.polaroidAngle ?? -4}deg"><i class="travel-leaflet-polaroid__pin"></i><i class="travel-leaflet-polaroid__thread"></i><img src="${place.photos[0]?.thumbnail ?? place.photos[0]?.image ?? ''}" alt="" /><strong>${place.city}</strong></span>`,
  // Fixed Leaflet pixel dimensions keep the map card small at every map zoom.
  iconSize: [106, 132],
  iconAnchor: [16, 118],
})

/** Leaflet-based map: data uses geographic coordinates, not visual percentage placement. */
export function TravelDiaryArchive() {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const selectedPlace = travelPlaces.find((place) => place.id === selectedPlaceId)
  const visitedProvinceNames = useMemo(
    () => new Set(travelPlaces.filter((place) => place.visited).map((place) => place.province)),
    [],
  )
  const cityIcons = useMemo(() => new Map(travelPlaces.map((place) => [place.id, cityMarkerIcon(place.markerColor)])), [])
  const polaroidIcons = useMemo(() => new Map(travelPlaces.filter((place) => place.hasPhotos).map((place) => [place.id, polaroidMarkerIcon(place)])), [])
  const provinceStyle = (name?: string): PathOptions => {
    const visited = Boolean(name && visitedProvinceNames.has(name))
    return {
      color: visited ? '#4d9de0' : '#96c5d2',
      weight: visited ? 1.4 : 0.8,
      fillColor: visited ? '#7fc6ef' : '#dff3f5',
      fillOpacity: visited ? 0.18 : 0.045,
    }
  }

  const onEachProvince = (feature: GeoJSON.Feature<GeoJSON.Geometry, ProvinceProperties>, layer: Layer) => {
    const provinceName = feature.properties?.name ?? '未命名区域'
    const path = layer as Path
    const resetStyle = () => path.setStyle(provinceStyle(provinceName))

    path.setStyle(provinceStyle(provinceName))
    path.bindTooltip(provinceName, { sticky: true, direction: 'top', className: 'travel-province-tooltip' })
    path.on({
      mouseover: () => path.setStyle({ weight: 1.7, fillOpacity: visitedProvinceNames.has(provinceName) ? 0.3 : 0.14 }),
      mouseout: resetStyle,
      click: () => setSelectedProvince(provinceName),
    })
  }

  const provinceSummary = selectedProvince
    ? `${selectedProvince} · ${visitedProvinceNames.has(selectedProvince) ? '已到访' : '旅行档案待补充'}`
    : '点击省份查看旅行档案状态'

  return (
    <section className="travel-diary" aria-label="Travel Diary Archive">
      <MapContainer
        className="travel-leaflet-map"
        center={chinaCenter}
        zoom={5}
        minZoom={2}
        maxZoom={14}
        zoomSnap={0.25}
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        dragging
        keyboard
        zoomControl={false}
      >
        <MapSizeLifecycle />
        <GeoJSON data={chinaProvinceGeoJson} onEachFeature={onEachProvince} />
        <ZoomControl position="bottomright" />

        {travelPlaces.filter((place) => place.visited).map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={cityIcons.get(place.id)}
            title={place.city}
            eventHandlers={{ click: (event) => event.target.openTooltip() }}
          >
            <Tooltip direction="top" offset={[0, -8]}>{place.city}</Tooltip>
          </Marker>
        ))}

        {travelPlaces.filter((place) => place.hasPhotos && place.photos.length > 0).map((place) => (
          <Marker
            key={`${place.id}-polaroid`}
            position={[place.lat, place.lng]}
            icon={polaroidIcons.get(place.id)}
            zIndexOffset={500}
            title={`${place.city}旅行照片`}
            eventHandlers={{ click: () => setSelectedPlaceId(place.id) }}
          />
        ))}
      </MapContainer>

      <p className="travel-province-status" aria-live="polite">{provinceSummary}</p>

      {selectedPlace?.photos[0] && (
        <TravelPhotoViewer
          image={selectedPlace.photos[0].image}
          alt={selectedPlace.photos[0].alt}
          label={selectedPlace.city}
          onClose={() => setSelectedPlaceId(null)}
        />
      )}
    </section>
  )
}
