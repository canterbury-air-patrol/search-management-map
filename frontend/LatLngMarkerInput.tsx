import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

interface Props {
  map: L.Map
  initialPos: L.LatLng
  showLabels?: boolean
  onChange?: (pos: L.LatLng) => void
}

export function LatLngMarkerInput({ map, initialPos, showLabels = true, onChange }: Props) {
  const [latText, setLatText] = useState(degreesToDM(initialPos.lat, 'lat'))
  const [lngText, setLngText] = useState(degreesToDM(initialPos.lng, 'lon'))
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    // Mount-only: the marker tracks user drags via setLatLng below, so we
    // intentionally don't recreate it when initialPos/onChange change.
    const marker = L.marker(initialPos, { draggable: true, autoPan: true }).addTo(map)
    markerRef.current = marker
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setLatText(degreesToDM(pos.lat, 'lat'))
      setLngText(degreesToDM(pos.lng, 'lon'))
      onChange?.(pos)
    })
    return () => {
      marker.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncMarker(lat: string, lng: string) {
    const latDeg = DMToDegrees(lat)
    const lngDeg = DMToDegrees(lng)
    if (isFinite(latDeg) && isFinite(lngDeg) && markerRef.current) {
      const pos = L.latLng(latDeg, lngDeg)
      markerRef.current.setLatLng(pos)
      onChange?.(pos)
    }
  }

  return (
    <div className="mb-2">
      {showLabels && (
        <div className="d-flex gap-2 mb-1">
          <small className="flex-fill text-center">Lat</small>
          <small className="flex-fill text-center">Long</small>
        </div>
      )}
      <div className="d-flex gap-2">
        <input
          type="text"
          className="form-control form-control-sm flex-fill"
          value={latText}
          onChange={(e) => {
            setLatText(e.target.value)
            syncMarker(e.target.value, lngText)
          }}
        />
        <input
          type="text"
          className="form-control form-control-sm flex-fill"
          value={lngText}
          onChange={(e) => {
            setLngText(e.target.value)
            syncMarker(latText, e.target.value)
          }}
        />
      </div>
    </div>
  )
}
